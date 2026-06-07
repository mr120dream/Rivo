import { useEffect } from 'react';
import { router } from 'expo-router';
import { HabitDayView } from '../../components/HabitDayView';
import { useHabits } from '../../contexts/HabitsContext';
import { addDays } from '../../lib/habitSchedule';

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
    error,
    retry,
    ensureTomorrowLoaded,
  } = useHabits();

  useEffect(() => {
    ensureTomorrowLoaded();
  }, [ensureTomorrowLoaded]);

  const tomorrow = addDays(new Date(), 1);

  const handleEdit = (habit: { id: string }) => {
    router.push({ pathname: '/(tabs)/add-habit', params: { editId: habit.id } });
  };

  return (
    <HabitDayView
      title="Tomorrow"
      date={tomorrow}
      habits={tomorrowHabits}
      loading={loading || tomorrowLoading}
      error={error}
      onRetry={retry}
      onToggle={(id) => toggleHabitForDate(id, tomorrowDate)}
      onEdit={handleEdit}
      onDelete={deleteHabit}
      completedCount={tomorrowCompletedCount}
      progress={tomorrowProgress}
      emptyTitle="Nothing scheduled tomorrow"
      emptyBody="No habits are scheduled for tomorrow based on their frequency."
    />
  );
}
