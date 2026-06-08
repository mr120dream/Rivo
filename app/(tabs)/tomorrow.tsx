import { useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { HabitDayView } from '../../components/HabitDayView';
import { UpcomingHabitBanner } from '../../components/UpcomingHabitBanner';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { useHabits } from '../../contexts/HabitsContext';
import { addDays } from '../../lib/habitSchedule';
import { getUpNextMorningHabit } from '../../lib/upcoming';
import { formatReminderTime } from '../../lib/utils';

export default function TomorrowScreen() {
  const {
    tomorrowHabits,
    tomorrowDate,
    toggleHabitForDate,
    deleteHabit,
    tomorrowCompletedCount,
    tomorrowProgress,
    loading,
    tomorrowLoading,
    refreshing,
    error,
    retry,
    refresh,
    ensureTomorrowLoaded,
  } = useHabits();

  useEffect(() => {
    ensureTomorrowLoaded();
  }, [ensureTomorrowLoaded]);

  const tomorrow = addDays(new Date(), 1);
  const upNextMorning = useMemo(() => getUpNextMorningHabit(tomorrowHabits), [tomorrowHabits]);

  const handleEdit = (habit: { id: string }) => {
    router.push({ pathname: '/(tabs)/add-habit', params: { editId: habit.id } });
  };

  return (
    <ErrorBoundary>
      <HabitDayView
        title="Tomorrow"
        date={tomorrow}
        habits={tomorrowHabits}
        loading={loading || tomorrowLoading}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        error={error}
        onRetry={retry}
        onToggle={(id) => toggleHabitForDate(id, tomorrowDate)}
        onEdit={handleEdit}
        onDelete={deleteHabit}
        completedCount={tomorrowCompletedCount}
        progress={tomorrowProgress}
        emptyTitle="Nothing scheduled tomorrow"
        emptyBody="No habits are scheduled for tomorrow based on their frequency."
        subtitle="Pre-completing for tomorrow"
        topSection={
          upNextMorning ? (
            <UpcomingHabitBanner
              label="First up tomorrow"
              habit={upNextMorning}
              timeText={formatReminderTime(upNextMorning.reminderTime)}
              onPress={() => toggleHabitForDate(upNextMorning.id, tomorrowDate)}
            />
          ) : null
        }
      />
    </ErrorBoundary>
  );
}
