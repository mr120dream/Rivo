import { FirstHabitCelebrationOverlay } from './FirstHabitCelebrationOverlay';
import { useHabits } from '../contexts/HabitsContext';

export function FirstHabitCelebrationHost() {
  const { showFirstHabitCelebration, firstHabitCelebration, dismissFirstHabitCelebration } =
    useHabits();

  return (
    <FirstHabitCelebrationOverlay
      visible={showFirstHabitCelebration}
      data={firstHabitCelebration}
      onDismiss={dismissFirstHabitCelebration}
    />
  );
}
