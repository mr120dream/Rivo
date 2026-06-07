import { getSupabase } from './supabase';
import { getLocalDateString } from './utils';

export type HabitStreakStat = {
  habitId: string;
  name: string;
  currentStreak: number;
  longestStreak: number;
};

export type WeeklyAnalytics = {
  completionRate: number;
  completedDays: number;
  scheduledDays: number;
  totalCompletions: number;
  streaks: HabitStreakStat[];
};

function getWeekStart(date = new Date()): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 6);
  return getLocalDateString(d);
}

export async function fetchWeeklyAnalytics(userId: string): Promise<WeeklyAnalytics> {
  const supabase = getSupabase();
  const weekStart = getWeekStart();

  const [{ data: habits }, { data: completions }] = await Promise.all([
    supabase.from('habits').select('id, name').eq('user_id', userId).eq('is_active', true),
    supabase
      .from('completions')
      .select('completed_date, habit_id')
      .eq('user_id', userId)
      .gte('completed_date', weekStart),
  ]);

  const activeHabits = habits ?? [];
  const habitIds = activeHabits.map((habit) => habit.id);
  const habitCount = activeHabits.length;
  const totalCompletions = completions?.length ?? 0;
  const scheduledDays = habitCount * 7;
  const completionRate = scheduledDays === 0 ? 0 : totalCompletions / scheduledDays;

  const uniqueDays = new Set(completions?.map((c) => c.completed_date) ?? []);

  let streakRows: Array<{
    habit_id: string;
    current_streak: number;
    longest_streak: number;
    habits: { name?: string } | null;
  }> = [];

  if (habitIds.length > 0) {
    const { data } = await supabase
      .from('streaks')
      .select('habit_id, current_streak, longest_streak, habits(name)')
      .in('habit_id', habitIds);
    streakRows = (data as typeof streakRows | null) ?? [];
  }

  const streaks: HabitStreakStat[] = streakRows.map((row) => ({
    habitId: row.habit_id,
    name: (row.habits as { name?: string } | null)?.name ?? 'Habit',
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
  }));

  return {
    completionRate,
    completedDays: uniqueDays.size,
    scheduledDays,
    totalCompletions,
    streaks,
  };
}

export async function generateDebrief(userId: string): Promise<string> {
  const { data, error } = await getSupabase().functions.invoke('claude-debrief', {
    body: { userId },
  });

  if (error) {
    throw new Error(error.message ?? 'Failed to generate debrief.');
  }

  if (data?.error) {
    throw new Error(data.error as string);
  }

  return (data?.summary as string) ?? 'No debrief available.';
}
