import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotifiableHabit } from '../types/habit';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIF_ID_KEY = 'rivo_notification_ids';
export const NOTIFICATION_PERMISSION_SEEN_KEY = 'rivo_notification_permission_seen';

export async function hasSeenNotificationPermission(): Promise<boolean> {
  const value = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_SEEN_KEY);
  return value === 'true';
}

export async function markNotificationPermissionSeen(): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_PERMISSION_SEEN_KEY, 'true');
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habit-reminders', {
      name: 'Habit reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleHabitNotification(habit: NotifiableHabit): Promise<void> {
  await cancelHabitNotification(habit.id);

  if (!habit.reminder_enabled || !habit.reminder_time) {
    return;
  }

  const [hours, minutes] = habit.reminder_time.split(':').map(Number);

  const daysToSchedule: number[] =
    habit.frequency === 'weekdays'
      ? [2, 3, 4, 5, 6]
      : habit.frequency === 'weekends'
        ? [1, 7]
        : habit.frequency === 'custom' && habit.custom_days
          ? habit.custom_days.map((day) => day + 1)
          : [];

  const ids: string[] = [];

  if (habit.frequency === 'daily' || daysToSchedule.length === 0) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rivo',
        body: `Time for: ${habit.name}`,
        data: { habitId: habit.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });
    ids.push(id);
  } else {
    for (const weekday of daysToSchedule) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rivo',
          body: `Time for: ${habit.name}`,
          data: { habitId: habit.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: hours,
          minute: minutes,
        },
      });
      ids.push(id);
    }
  }

  const stored = await getStoredIds();
  stored[habit.id] = ids;
  await AsyncStorage.setItem(NOTIF_ID_KEY, JSON.stringify(stored));
}

export async function cancelHabitNotification(habitId: string): Promise<void> {
  const stored = await getStoredIds();
  const ids = stored[habitId] ?? [];

  for (const id of ids) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  delete stored[habitId];
  await AsyncStorage.setItem(NOTIF_ID_KEY, JSON.stringify(stored));
}

export async function rescheduleAllNotifications(habits: NotifiableHabit[]): Promise<void> {
  for (const habit of habits) {
    if (habit.reminder_enabled && habit.reminder_time) {
      await scheduleHabitNotification(habit);
    }
  }
}

async function getStoredIds(): Promise<Record<string, string[]>> {
  const raw = await AsyncStorage.getItem(NOTIF_ID_KEY);
  return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
}
