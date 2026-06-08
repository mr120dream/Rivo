import { useMemo } from 'react';
import { router } from 'expo-router';
import { HabitDayView } from '../../components/HabitDayView';
import { TodayEmptyState } from '../../components/TodayEmptyState';
import { UpcomingHabitBanner } from '../../components/UpcomingHabitBanner';
import { WelcomeBackBanner } from '../../components/WelcomeBackBanner';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { useAuth } from '../../contexts/AuthContext';
import { useHabits } from '../../contexts/HabitsContext';
import { useWelcomeBack } from '../../contexts/WelcomeBackContext';
import { formatMinutesUntil, getNextUpcomingHabit } from '../../lib/upcoming';

export default function TodayScreen() {
  const { user } = useAuth();
  const { showWelcomeBack, dismissWelcomeBack } = useWelcomeBack();
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
  const bestStreak = useMemo(
    () => Math.max(0, ...allHabits.map((habit) => habit.currentStreak ?? 0)),
    [allHabits],
  );

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
          <>
            {showWelcomeBack ? (
              <WelcomeBackBanner
                name={user?.email ?? undefined}
                streak={bestStreak}
                onDismiss={dismissWelcomeBack}
              />
            ) : null}
            {upcomingHabit ? (
              <UpcomingHabitBanner
                label="Up next"
                habit={upcomingHabit}
                timeText={formatMinutesUntil(upcomingHabit.minutesFromNow)}
                onPress={() => toggleHabit(upcomingHabit.id)}
              />
            ) : null}
          </>
        }
      />
    </ErrorBoundary>
  );
}
