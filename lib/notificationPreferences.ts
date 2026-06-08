import AsyncStorage from '@react-native-async-storage/async-storage';

export const NOTIF_PREFS_KEYS = {
  habits: 'rivo_notif_habits',
  followup: 'rivo_notif_followup',
  summary: 'rivo_notif_summary',
  streaks: 'rivo_notif_streaks',
} as const;

export type NotificationPreferences = {
  habitReminders: boolean;
  followUpReminders: boolean;
  dailySummary: boolean;
  streakAlerts: boolean;
};

const DEFAULT_PREFS: NotificationPreferences = {
  habitReminders: true,
  followUpReminders: true,
  dailySummary: true,
  streakAlerts: true,
};

async function readBool(key: string, defaultValue: boolean): Promise<boolean> {
  const value = await AsyncStorage.getItem(key);
  if (value === null) {
    return defaultValue;
  }
  return value === 'true';
}

async function writeBool(key: string, value: boolean): Promise<void> {
  await AsyncStorage.setItem(key, value ? 'true' : 'false');
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const [habitReminders, followUpReminders, dailySummary, streakAlerts] = await Promise.all([
    readBool(NOTIF_PREFS_KEYS.habits, DEFAULT_PREFS.habitReminders),
    readBool(NOTIF_PREFS_KEYS.followup, DEFAULT_PREFS.followUpReminders),
    readBool(NOTIF_PREFS_KEYS.summary, DEFAULT_PREFS.dailySummary),
    readBool(NOTIF_PREFS_KEYS.streaks, DEFAULT_PREFS.streakAlerts),
  ]);

  return {
    habitReminders,
    followUpReminders,
    dailySummary,
    streakAlerts,
  };
}

export async function saveNotificationPreferences(
  prefs: NotificationPreferences,
): Promise<void> {
  await Promise.all([
    writeBool(NOTIF_PREFS_KEYS.habits, prefs.habitReminders),
    writeBool(NOTIF_PREFS_KEYS.followup, prefs.followUpReminders),
    writeBool(NOTIF_PREFS_KEYS.summary, prefs.dailySummary),
    writeBool(NOTIF_PREFS_KEYS.streaks, prefs.streakAlerts),
  ]);
}

export async function updateNotificationPreference<K extends keyof NotificationPreferences>(
  key: K,
  value: NotificationPreferences[K],
): Promise<NotificationPreferences> {
  const current = await getNotificationPreferences();
  const next = { ...current, [key]: value };
  await saveNotificationPreferences(next);
  return next;
}
