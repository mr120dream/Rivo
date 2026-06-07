import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400, headers: corsHeaders });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status')
      .eq('id', userId)
      .single();

    const status = profile?.subscription_status ?? 'free';
    if (status !== 'pro' && status !== 'lifetime') {
      return Response.json({ error: 'Pro subscription required' }, { status: 403, headers: corsHeaders });
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const [{ data: habits }, { data: completions }, { data: streaks }] = await Promise.all([
      supabaseAdmin.from('habits').select('name, time_of_day').eq('user_id', userId).eq('is_active', true),
      supabaseAdmin
        .from('completions')
        .select('completed_date, habit_id')
        .eq('user_id', userId)
        .gte('completed_date', weekAgoStr),
      supabaseAdmin
        .from('streaks')
        .select('current_streak, longest_streak, habit_id, habits(name)')
        .in(
          'habit_id',
          (
            await supabaseAdmin.from('habits').select('id').eq('user_id', userId).eq('is_active', true)
          ).data?.map((h) => h.id) ?? [],
        ),
    ]);

    const habitNames = Object.fromEntries((habits ?? []).map((h) => [h.name, h.time_of_day]));
    const completionCount = completions?.length ?? 0;
    const streakSummary = (streaks ?? [])
      .map((s) => {
        const name = (s.habits as { name?: string } | null)?.name ?? 'Habit';
        return `${name}: ${s.current_streak}-day streak (best ${s.longest_streak})`;
      })
      .join('\n');

    const prompt = `You are a supportive habit coach. Write a brief, warm weekly debrief (3-4 short paragraphs) for a user based on this data:

Active habits: ${Object.keys(habitNames).join(', ') || 'none'}
Completions this week: ${completionCount}
Streaks:
${streakSummary || 'No streak data yet'}

Be encouraging, specific, and actionable. No bullet lists.`;

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return Response.json(
        {
          summary:
            'Great week! Keep showing up for your habits — consistency beats perfection. Review which times of day work best and protect those windows.',
        },
        { headers: corsHeaders },
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const result = await response.json();
    const summary =
      result.content?.[0]?.text ??
      'Nice work this week. Focus on the habits that felt easiest and build from there.';

    return Response.json({ summary }, { headers: corsHeaders });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Debrief failed' },
      { status: 500, headers: corsHeaders },
    );
  }
});
