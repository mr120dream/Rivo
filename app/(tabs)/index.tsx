import { useMemo } from 'react';
import { router } from 'expo-router';
import { HabitDayView } from '../../components/HabitDayView';
import { TodayEmptyState } from '../../components/TodayEmptyState';
import { UpcomingHabitBanner } from '../../components/UpcomingHabitBanner';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { useHabits } from '../../contexts/HabitsContext';
import { formatMinutesUntil, getNextUpcomingHabit } from '../../lib/upcoming';

export default function TodayScreen() {
  const {
    allHabits,
    todayHabits,
    toggleHabit,
    deleteHabit,
    completedCount,
    progress,
    loading,
    error,
    retry,
    refresh,
    refreshing,
  } = useHabits();

  const emptyVariant = allHabits.length === 0 ? 'no-habits' : 'nothing-scheduled';
  const upcomingHabit = useMemo(() => getNextUpcomingHabit(todayHabits), [todayHabits]);

  return (
    <ErrorBoundary>
      <HabitDayView
        title="Today"
        date={new Date()}
        habits={todayHabits}
        loading={loading}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        error={error}
        onRetry={retry}
        onToggle={toggleHabit}
        onEdit={(habit) =>
          router.push({ pathname: '/(tabs)/add-habit', params: { editId: habit.id } })
        }
        onDelete={deleteHabit}
        completedCount={completedCount}
        progress={progress}
        emptyTitle=""
        emptyBody=""
        emptyContent={<TodayEmptyState variant={emptyVariant} />}
        topSection={
          upcomingHabit ? (
            <UpcomingHabitBanner
              label="Up next"
              habit={upcomingHabit}
              timeText={formatMinutesUntil(upcomingHabit.minutesFromNow)}
              onPress={() => toggleHabit(upcomingHabit.id)}
            />
          ) : null
        }
      />
    </ErrorBoundary>
  );
}
