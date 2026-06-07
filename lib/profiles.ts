import { getSupabase } from './supabase';

export async function ensureProfile(userId: string, email?: string | null): Promise<void> {
  const supabase = getSupabase();
  const { data: existing } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();

  if (existing) {
    return;
  }

  const { error } = await supabase.from('profiles').insert({
    id: userId,
    email: email ?? null,
  });

  if (error && !error.message.includes('duplicate')) {
    throw error;
  }
}
