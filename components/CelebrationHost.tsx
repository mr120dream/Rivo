import { CelebrationOverlay } from './CelebrationOverlay';
import { useHabits } from '../contexts/HabitsContext';

export function CelebrationHost() {
  const { showCelebration, celebration, dismissCelebration } = useHabits();

  return (
    <CelebrationOverlay
      visible={showCelebration}
      data={celebration}
      onDismiss={dismissCelebration}
    />
  );
}
