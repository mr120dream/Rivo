import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { isHabitScheduledForDate } from '../lib/habitSchedule';
import {
  createHabit as createHabitInDb,
  deleteHabit as deleteHabitInDb,
  fetchCompletionsForDate,
  fetchHabitRows,
  mapHabitToNotifiable,
  toggleCompletion,
  updateHabit as updateHabitInDb,
} from '../lib/habits';
import {
  cancelHabitNotification,
  rescheduleAllNotifications,
  scheduleHabitNotification,
} from '../lib/notifications';
import { getLocalDateString, getTomorrowDateString } from '../lib/utils';
import { Habit, HabitUpdate, NewHabit } from '../types/habit';
import { useAuth } from './AuthContext';

type HabitsContextValue = {
  allHabits: Habit[];
  todayHabits: Habit[];
  tomorrowHabits: Habit[];
  tomorrowDate: string;
  loading: boolean;
  tomorrowLoading: boolean;
  error: string | null;
  retry: () => void;
  ensureTomorrowLoaded: () => void;
  toggleHabit: (id: string) => void;
  toggleHabitForDate: (id: string, date: string) => void;
  addHabit: (habit: NewHabit) => Promise<void>;
  updateHabit: (id: string, updates: HabitUpdate) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  getHabitById: (id: string) => Habit | undefined;
  completedCount: number;
  progress: number;
  tomorrowCompletedCount: number;
  tomorrowProgress: number;
};

const HabitsContext = createContext<HabitsContextValue | null>(null);

function mergeHabitsWithCompletions(
  habits: Habit[],
  date: string,
  completionsByDate: Record<string, Set<string>>,
): Habit[] {
  const dateObj = new Date(`${date}T12:00:00`);
  const completions = completionsByDate[date] ?? new Set<string>();

  return habits
    .filter((habit) => isHabitScheduledForDate(habit, dateObj))
    .map((habit) => ({
      ...habit,
      completed: completions.has(habit.id),
    }));
}

export function HabitsProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  const [completionsByDate, setCompletionsByDate] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(false);
  const [tomorrowLoading, setTomorrowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tomorrowLoaded, setTomorrowLoaded] = useState(false);

  const today = getLocalDateString();
  const tomorrowDate = getTomorrowDateString();

  const loadHabits = useCallback(async () => {
    if (!user) {
      setAllHabits([]);
      setCompletionsByDate({});
      setTomorrowLoaded(false);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [habits, todayCompletions] = await Promise.all([
        fetchHabitRows(user.id, user.email),
        fetchCompletionsForDate(user.id, today),
      ]);

      setAllHabits(habits);
      setCompletionsByDate({ [today]: todayCompletions });
      setTomorrowLoaded(false);

      if (habits.length > 0) {
        void rescheduleAllNotifications(habits.map(mapHabitToNotifiable));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load habits.');
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  const loadTomorrowCompletions = useCallback(async () => {
    if (!user || tomorrowLoaded) {
      return;
    }

    setTomorrowLoading(true);

    try {
      const tomorrowCompletions = await fetchCompletionsForDate(user.id, tomorrowDate);
      setCompletionsByDate((prev) => ({ ...prev, [tomorrowDate]: tomorrowCompletions }));
      setTomorrowLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tomorrow.');
    } finally {
      setTomorrowLoading(false);
    }
  }, [user, tomorrowDate, tomorrowLoaded]);

  useEffect(() => {
    void loadHabits();
  }, [loadHabits, session?.access_token]);

  const getHabitsForDate = useCallback(
    (date: string) => mergeHabitsWithCompletions(allHabits, date, completionsByDate),
    [allHabits, completionsByDate],
  );

  const todayHabits = useMemo(() => getHabitsForDate(today), [getHabitsForDate, today]);
  const tomorrowHabits = useMemo(
    () => getHabitsForDate(tomorrowDate),
    [getHabitsForDate, tomorrowDate],
  );

  const toggleHabitForDate = useCallback(
    (id: string, date: string) => {
      if (!user) {
        return;
      }

      const scheduled = getHabitsForDate(date);
      const habit = scheduled.find((item) => item.id === id);
      if (!habit) {
        return;
      }

      const nextCompleted = !habit.completed;

      setCompletionsByDate((prev) => {
        const current = new Set(prev[date] ?? []);
        if (nextCompleted) {
          current.add(id);
        } else {
          current.delete(id);
        }
        return { ...prev, [date]: current };
      });

      void toggleCompletion(id, user.id, date, nextCompleted).catch(() => {
        setCompletionsByDate((prev) => {
          const current = new Set(prev[date] ?? []);
          if (habit.completed) {
            current.add(id);
          } else {
            current.delete(id);
          }
          return { ...prev, [date]: current };
        });
        setError('Could not update habit. Tap retry to refresh.');
      });
    },
    [getHabitsForDate, user],
  );

  const toggleHabit = useCallback(
    (id: string) => toggleHabitForDate(id, today),
    [toggleHabitForDate, today],
  );

  const addHabit = useCallback(
    async (habit: NewHabit) => {
      if (!user) {
        throw new Error('You must be signed in to add a habit.');
      }

      const tempId = `temp-${Date.now()}`;
      const optimistic: Habit = {
        id: tempId,
        name: habit.name,
        icon: habit.icon,
        color: habit.color ?? '#6366f1',
        timeOfDay: habit.timeOfDay,
        frequency: habit.frequency ?? 'daily',
        customDays: habit.customDays ?? null,
        reminderTime: habit.reminderTime,
        reminderEnabled: habit.reminderEnabled ?? true,
        completed: false,
        sortOrder: allHabits.length,
      };

      setAllHabits((prev) => [...prev, optimistic]);

      try {
        const created = await createHabitInDb(habit, user.id, user.email);
        setAllHabits((prev) => prev.map((item) => (item.id === tempId ? created : item)));

        if (created.reminderEnabled) {
          await scheduleHabitNotification(mapHabitToNotifiable(created));
        }
      } catch (e) {
        setAllHabits((prev) => prev.filter((item) => item.id !== tempId));
        throw e;
      }
    },
    [allHabits.length, user],
  );

  const updateHabit = useCallback(
    async (id: string, updates: HabitUpdate) => {
      const previous = allHabits.find((habit) => habit.id === id);
      if (!previous) {
        throw new Error('Habit not found.');
      }

      const optimistic = { ...previous, ...updates };
      setAllHabits((prev) => prev.map((habit) => (habit.id === id ? optimistic : habit)));

      try {
        const updated = await updateHabitInDb(id, updates);
        const merged = { ...previous, ...updates, ...updated };
        setAllHabits((prev) => prev.map((habit) => (habit.id === id ? merged : habit)));

        if (merged.reminderEnabled && merged.reminderTime) {
          await scheduleHabitNotification(mapHabitToNotifiable(merged));
        } else {
          await cancelHabitNotification(id);
        }
      } catch (e) {
        setAllHabits((prev) => prev.map((habit) => (habit.id === id ? previous : habit)));
        throw e;
      }
    },
    [allHabits],
  );

  const deleteHabit = useCallback(async (id: string) => {
    await deleteHabitInDb(id);
    await cancelHabitNotification(id);
    setAllHabits((prev) => prev.filter((habit) => habit.id !== id));
    setCompletionsByDate((prev) => {
      const next: Record<string, Set<string>> = {};
      for (const [date, ids] of Object.entries(prev)) {
        const copy = new Set(ids);
        copy.delete(id);
        next[date] = copy;
      }
      return next;
    });
  }, []);

  const getHabitById = useCallback(
    (id: string) => allHabits.find((habit) => habit.id === id),
    [allHabits],
  );

  const completedCount = useMemo(
    () => todayHabits.filter((habit) => habit.completed).length,
    [todayHabits],
  );

  const progress = useMemo(
    () => (todayHabits.length === 0 ? 0 : completedCount / todayHabits.length),
    [todayHabits.length, completedCount],
  );

  const tomorrowCompletedCount = useMemo(
    () => tomorrowHabits.filter((habit) => habit.completed).length,
    [tomorrowHabits],
  );

  const tomorrowProgress = useMemo(
    () => (tomorrowHabits.length === 0 ? 0 : tomorrowCompletedCount / tomorrowHabits.length),
    [tomorrowHabits.length, tomorrowCompletedCount],
  );

  const value = useMemo(
    () => ({
      allHabits,
      todayHabits,
      tomorrowHabits,
      tomorrowDate,
      loading,
      tomorrowLoading,
      error,
      retry: () => {
        void loadHabits();
      },
      ensureTomorrowLoaded: () => {
        void loadTomorrowCompletions();
      },
      toggleHabit,
      toggleHabitForDate,
      addHabit,
      updateHabit,
      deleteHabit,
      getHabitById,
      completedCount,
      progress,
      tomorrowCompletedCount,
      tomorrowProgress,
    }),
    [
      allHabits,
      todayHabits,
      tomorrowHabits,
      tomorrowDate,
      loading,
      tomorrowLoading,
      error,
      loadHabits,
      loadTomorrowCompletions,
      toggleHabit,
      toggleHabitForDate,
      addHabit,
      updateHabit,
      deleteHabit,
      getHabitById,
      completedCount,
      progress,
      tomorrowCompletedCount,
      tomorrowProgress,
    ],
  );

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits() {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error('useHabits must be used within HabitsProvider');
  }
  return context;
}
