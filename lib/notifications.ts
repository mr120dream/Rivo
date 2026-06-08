import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getNotificationPreferences } from './notificationPreferences';
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
export const DAILY_SUMMARY_ID = 'daily-summary';
export const NOTIFICATION_PERMISSION_SEEN_KEY = 'rivo_notification_permission_seen';

function followUpKey(habitId: string): string {
  return `${habitId}_followup`;
}

function buildMainContent(
  habit: NotifiableHabit,
  streakAlertsEnabled: boolean,
): Notifications.NotificationContentInput {
  const streak = habit.current_streak ?? 0;

  if (streakAlertsEnabled && streak >= 7) {
    return {
      title: '🔥 Keep your streak alive!',
      body: `Don't break your ${streak}-day streak — time for: ${habit.name}`,
      sound: 'default',
      interruptionLevel: 'timeSensitive',
      data: { habitId: habit.id },
    };
  }

  return {
    title: 'Rivo',
    body: `Time for: ${habit.name}`,
    sound: 'default',
    data: { habitId: habit.id },
  };
}

async function scheduleFollowUps(
  habit: NotifiableHabit,
  hours: number,
  minutes: number,
  daysToSchedule: number[],
): Promise<string[]> {
  const followUpHours = (hours + 2) % 24;
  const followUpIds: string[] = [];
  const content: Notifications.NotificationContentInput = {
    title: 'Still time today 👋',
    body: `You haven't done "${habit.name}" yet — there's still time.`,
    sound: 'default',
    data: { habitId: habit.id, isFollowUp: true },
  };

  if (habit.frequency === 'daily' || daysToSchedule.length === 0) {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: followUpHours,
        minute: minutes,
      },
    });
    followUpIds.push(id);
  } else {
    for (const weekday of daysToSchedule) {
      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: followUpHours,
          minute: minutes,
        },
      });
      followUpIds.push(id);
    }
  }

  return followUpIds;
}

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

export async function scheduleDailySummaryNotification(_userId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_SUMMARY_ID);

  const prefs = await getNotificationPreferences();
  if (!prefs.dailySummary) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_SUMMARY_ID,
    content: {
      title: 'Your day in Rivo',
      body: 'Tap to see how you did today and prep for tomorrow.',
      sound: 'default',
      data: { type: 'daily-summary' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
    },
  });
}

export async function cancelDailySummaryNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_SUMMARY_ID);
}

export async function scheduleHabitNotification(habit: NotifiableHabit): Promise<void> {
  await cancelHabitNotification(habit.id);

  const prefs = await getNotificationPreferences();
  if (!prefs.habitReminders || !habit.reminder_enabled || !habit.reminder_time) {
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
  const content = buildMainContent(habit, prefs.streakAlerts);

  if (habit.frequency === 'daily' || daysToSchedule.length === 0) {
    const id = await Notifications.scheduleNotificationAsync({
      content,
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
        content,
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

  const followUpIds = prefs.followUpReminders
    ? await scheduleFollowUps(habit, hours, minutes, daysToSchedule)
    : [];

  const stored = await getStoredIds();
  stored[habit.id] = ids;
  if (followUpIds.length > 0) {
    stored[followUpKey(habit.id)] = followUpIds;
  } else {
    delete stored[followUpKey(habit.id)];
  }
  await AsyncStorage.setItem(NOTIF_ID_KEY, JSON.stringify(stored));
}

export async function cancelFollowUpNotifications(habitId: string): Promise<void> {
  const stored = await getStoredIds();
  const key = followUpKey(habitId);
  const followUpIds = stored[key] ?? [];

  for (const id of followUpIds) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  delete stored[key];
  await AsyncStorage.setItem(NOTIF_ID_KEY, JSON.stringify(stored));
}

export async function cancelHabitNotification(habitId: string): Promise<void> {
  const stored = await getStoredIds();
  const ids = stored[habitId] ?? [];
  const followUpIds = stored[followUpKey(habitId)] ?? [];

  for (const id of [...ids, ...followUpIds]) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  delete stored[habitId];
  delete stored[followUpKey(habitId)];
  await AsyncStorage.setItem(NOTIF_ID_KEY, JSON.stringify(stored));
}

export async function rescheduleAllNotifications(habits: NotifiableHabit[]): Promise<void> {
  const prefs = await getNotificationPreferences();

  if (!prefs.habitReminders) {
    for (const habit of habits) {
      await cancelHabitNotification(habit.id);
    }
    return;
  }

  for (const habit of habits) {
    if (habit.reminder_enabled && habit.reminder_time) {
      await scheduleHabitNotification(habit);
    }
  }
}

export async function applyNotificationPreferences(
  userId: string,
  habits: NotifiableHabit[],
): Promise<void> {
  await rescheduleAllNotifications(habits);
  await scheduleDailySummaryNotification(userId);
}

async function getStoredIds(): Promise<Record<string, string[]>> {
  const raw = await AsyncStorage.getItem(NOTIF_ID_KEY);
  return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
}

export async function verifyAndRescheduleAll(habits: NotifiableHabit[]): Promise<void> {
  const prefs = await getNotificationPreferences();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const scheduledIds = new Set(scheduled.map((n) => n.identifier));
  const stored = await getStoredIds();

  if (!prefs.habitReminders) {
    for (const habit of habits) {
      await cancelHabitNotification(habit.id);
    }
  }

  for (const habit of habits) {
    if (!habit.reminder_enabled || !habit.reminder_time) {
      continue;
    }

    if (!prefs.habitReminders) {
      continue;
    }

    const habitIds = stored[habit.id] ?? [];
    const followUpIds = stored[followUpKey(habit.id)] ?? [];
    const allScheduled =
      habitIds.length > 0 && habitIds.every((id) => scheduledIds.has(id));
    const allFollowUpsScheduled =
      !prefs.followUpReminders ||
      (followUpIds.length > 0 && followUpIds.every((id) => scheduledIds.has(id)));

    if (!allScheduled || !allFollowUpsScheduled) {
      await scheduleHabitNotification(habit);
    }
  }
}
