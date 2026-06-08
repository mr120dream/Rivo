import { Share } from 'react-native';
import { getSupabase } from './supabase';

type CompletionRow = {
  completed_date: string;
  habits: { name: string; time_of_day: string } | null;
};

export async function exportHabitsCSV(userId: string): Promise<void> {
  const { data: completions, error } = await getSupabase()
    .from('completions')
    .select('*, habits(name, time_of_day)')
    .eq('user_id', userId)
    .order('completed_date', { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (completions as CompletionRow[] | null) ?? [];
  const csv = [
    'Date,Habit,Time of Day,Completed',
    ...rows.map(
      (c) =>
        `${c.completed_date},${c.habits?.name ?? 'Unknown'},${c.habits?.time_of_day ?? ''},true`,
    ),
  ].join('\n');

  await Share.share({ message: csv, title: 'Rivo habit data' });
}
