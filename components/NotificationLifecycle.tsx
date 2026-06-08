import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useHabits } from '../contexts/HabitsContext';
import { mapHabitToNotifiable } from '../lib/habits';
import {
  scheduleDailySummaryNotification,
  verifyAndRescheduleAll,
} from '../lib/notifications';

export function NotificationLifecycle() {
  const { user } = useAuth();
  const { allHabits } = useHabits();

  useEffect(() => {
    if (!user) {
      return;
    }

    void scheduleDailySummaryNotification(user.id);
  }, [user?.id]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !user) {
        return;
      }

      void scheduleDailySummaryNotification(user.id);

      if (allHabits.length > 0) {
        void verifyAndRescheduleAll(allHabits.map(mapHabitToNotifiable));
      }
    });

    return () => subscription.remove();
  }, [allHabits, user]);

  return null;
}
