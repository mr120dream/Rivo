import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useHabits } from '../contexts/HabitsContext';
import { mapHabitToNotifiable } from '../lib/habits';
import { rescheduleAllNotifications } from '../lib/notifications';

export function NotificationLifecycle() {
  const { allHabits } = useHabits();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && allHabits.length > 0) {
        void rescheduleAllNotifications(allHabits.map(mapHabitToNotifiable));
      }
    });

    return () => subscription.remove();
  }, [allHabits]);

  return null;
}
