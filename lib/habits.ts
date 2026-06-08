import {
  DbHabit,
  Habit,
  HabitIcon,
  HabitUpdate,
  NewHabit,
  NotifiableHabit,
} from '../types/habit';
import { getLocalDateString } from './utils';
import { ensureProfile } from './profiles';
import { cancelFollowUpNotifications } from './notifications';
import { getSupabase } from './supabase';

const HABIT_ICONS: HabitIcon[] = [
  'leaf',
  'water',
  'book',
  'fitness',
  'moon',
  'sunny',
  'heart',
  'walk',
];

function parseIcon(icon: string): HabitIcon {
  if (HABIT_ICONS.includes(icon as HabitIcon)) {
    return icon as HabitIcon;
  }
  return 'leaf';
}

function formatReminderForDisplay(reminderTime: string | null): string {
  if (!reminderTime) {
    return '08:00';
  }
  const [hours, minutes] = reminderTime.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

function formatReminderForDb(reminderTime: string): string {
  const parts = reminderTime.split(':');
  const hours = parts[0]?.padStart(2, '0') ?? '08';
  const minutes = parts[1]?.padStart(2, '0') ?? '00';
  return `${hours}:${minutes}:00`;
}

export function mapDbHabitToHabit(row: DbHabit, completed: boolean): Habit {
  return {
    id: row.id,
    name: row.name,
    icon: parseIcon(row.icon),
    color: row.color,
    timeOfDay: row.time_of_day,
    frequency: row.frequency,
    customDays: row.custom_days,
    reminderTime: formatReminderForDisplay(row.reminder_time),
    reminderEnabled: row.reminder_enabled,
    completed,
    sortOrder: row.sort_order,
  };
}

export function mapHabitToNotifiable(habit: Habit): NotifiableHabit {
  return {
    id: habit.id,
    name: habit.name,
    reminder_time: habit.reminderTime ? formatReminderForDb(habit.reminderTime) : null,
    reminder_enabled: habit.reminderEnabled,
    frequency: habit.frequency,
    custom_days: habit.customDays,
    current_streak: habit.currentStreak ?? 0,
  };
}

function mapNewHabitToInsert(habit: NewHabit, userId: string) {
  return {
    user_id: userId,
    name: habit.name,
    icon: habit.icon,
    color: habit.color ?? '#6366f1',
    time_of_day: habit.timeOfDay,
    frequency: habit.frequency ?? 'daily',
    custom_days: habit.customDays ?? null,
    reminder_time: formatReminderForDb(habit.reminderTime),
    reminder_enabled: habit.reminderEnabled ?? true,
  };
}

function mapHabitUpdateToDb(updates: HabitUpdate) {
  const payload: Record<string, unknown> = {};

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.icon !== undefined) payload.icon = updates.icon;
  if (updates.color !== undefined) payload.color = updates.color;
  if (updates.timeOfDay !== undefined) payload.time_of_day = updates.timeOfDay;
  if (updates.frequency !== undefined) payload.frequency = updates.frequency;
  if (updates.customDays !== undefined) payload.custom_days = updates.customDays;
  if (updates.reminderTime !== undefined) payload.reminder_time = formatReminderForDb(updates.reminderTime);
  if (updates.reminderEnabled !== undefined) payload.reminder_enabled = updates.reminderEnabled;

  return payload;
}

export async function fetchCompletionsForDate(userId: string, date: string): Promise<Set<string>> {
  const { data, error } = await getSupabase()
    .from('completions')
    .select('habit_id')
    .eq('user_id', userId)
    .eq('completed_date', date);

  if (error) {
    throw error;
  }

  return new Set(data?.map((completion) => completion.habit_id) ?? []);
}

/** @deprecated Use fetchCompletionsForDate */
export async function fetchTodayCompletions(userId: string, date: string): Promise<Set<string>> {
  return fetchCompletionsForDate(userId, date);
}

export type HabitStreakHistory = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  recentDates: string[];
};

export async function fetchHabitStreakHistory(habitId: string): Promise<HabitStreakHistory> {
  const supabase = getSupabase();
  const [{ data: streak, error: streakError }, { data: completions, error: completionsError }] =
    await Promise.all([
      supabase
        .from('streaks')
        .select('current_streak, longest_streak, last_completed_date')
        .eq('habit_id', habitId)
        .maybeSingle(),
      supabase
        .from('completions')
        .select('completed_date')
        .eq('habit_id', habitId)
        .order('completed_date', { ascending: false })
        .limit(14),
    ]);

  if (streakError) {
    throw streakError;
  }
  if (completionsError) {
    throw completionsError;
  }

  return {
    currentStreak: streak?.current_streak ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    lastCompletedDate: (streak?.last_completed_date as string | null) ?? null,
    recentDates: completions?.map((row) => row.completed_date as string) ?? [],
  };
}

export async function fetchStreakMap(habitIds: string[]): Promise<Record<string, number>> {
  if (habitIds.length === 0) {
    return {};
  }

  const { data, error } = await getSupabase()
    .from('streaks')
    .select('habit_id, current_streak')
    .in('habit_id', habitIds);

  if (error) {
    throw error;
  }

  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    map[row.habit_id as string] = row.current_streak as number;
  }
  return map;
}

export async function fetchHabitRows(userId: string, email?: string | null): Promise<Habit[]> {
  await ensureProfile(userId, email);

  const supabase = getSupabase();
  const { data: habitRows, error: habitsError } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('sort_order');

  if (habitsError) {
    throw habitsError;
  }

  const habits = (habitRows as DbHabit[] | null)?.map((row) => mapDbHabitToHabit(row, false)) ?? [];
  const streakMap = await fetchStreakMap(habits.map((habit) => habit.id));

  return habits.map((habit) => ({
    ...habit,
    currentStreak: streakMap[habit.id] ?? 0,
  }));
}

export async function fetchHabits(userId: string, email?: string | null): Promise<Habit[]> {
  const today = getLocalDateString();
  const [habits, completions] = await Promise.all([
    fetchHabitRows(userId, email),
    fetchCompletionsForDate(userId, today),
  ]);

  return habits.map((habit) => ({
    ...habit,
    completed: completions.has(habit.id),
  }));
}

export async function createHabit(habit: NewHabit, userId: string, email?: string | null): Promise<Habit> {
  await ensureProfile(userId, email);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('habits')
    .insert(mapNewHabitToInsert(habit, userId))
    .select()
    .single();

  if (error) {
    throw error;
  }

  await supabase.from('streaks').insert({ habit_id: data.id });

  return mapDbHabitToHabit(data as DbHabit, false);
}

export async function updateHabit(id: string, updates: HabitUpdate): Promise<Habit> {
  const payload = mapHabitUpdateToDb(updates);
  if (Object.keys(payload).length === 0) {
    const { data, error } = await getSupabase().from('habits').select('*').eq('id', id).single();
    if (error) {
      throw error;
    }
    return mapDbHabitToHabit(data as DbHabit, false);
  }

  const { data, error } = await getSupabase()
    .from('habits')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapDbHabitToHabit(data as DbHabit, false);
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from('habits')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

export async function toggleCompletion(
  habitId: string,
  userId: string,
  date: string,
  completed: boolean,
): Promise<void> {
  const supabase = getSupabase();

  if (completed) {
    const { error } = await supabase.from('completions').upsert({
      habit_id: habitId,
      user_id: userId,
      completed_date: date,
    });
    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase
      .from('completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('completed_date', date);
    if (error) {
      throw error;
    }
  }

  await recalculateStreak(habitId);

  if (completed) {
    await cancelFollowUpNotifications(habitId);
  }
}

export async function recalculateStreak(habitId: string): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('completions')
    .select('completed_date')
    .eq('habit_id', habitId)
    .order('completed_date', { ascending: false })
    .limit(365);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    await supabase.from('streaks').upsert({
      habit_id: habitId,
      current_streak: 0,
      longest_streak: 0,
      last_completed_date: null,
      updated_at: new Date().toISOString(),
    });
    return;
  }

  const dates = data.map((row) => row.completed_date as string);
  let current = 0;
  let longest = 0;
  let temp = 1;
  const today = getLocalDateString();
  const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

  if (dates[0] === today || dates[0] === yesterday) {
    current = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(`${dates[i - 1]}T12:00:00`);
      const curr = new Date(`${dates[i]}T12:00:00`);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      if (diff === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(`${dates[i - 1]}T12:00:00`);
    const curr = new Date(`${dates[i]}T12:00:00`);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) {
      temp++;
      longest = Math.max(longest, temp);
    } else {
      temp = 1;
    }
  }
  longest = Math.max(longest, current, 1);

  await supabase.from('streaks').upsert({
    habit_id: habitId,
    current_streak: current,
    longest_streak: longest,
    last_completed_date: dates[0],
    updated_at: new Date().toISOString(),
  });
}
