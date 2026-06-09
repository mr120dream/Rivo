import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { colors, radii, spacing } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useHabits } from '../../contexts/HabitsContext';
import { usePaywall } from '../../contexts/PaywallContext';
import { exportHabitsCSV } from '../../lib/export';
import { mapHabitToNotifiable } from '../../lib/habits';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from '../../lib/notificationPreferences';
import { applyNotificationPreferences, requestNotificationPermission } from '../../lib/notifications';
import { resetOnboardingForDev } from '../../lib/onboarding';

export default function SettingsScreen() {
  const { user, isPro, subscriptionStatus, signOut } = useAuth();
  const { allHabits } = useHabits();
  const { showPaywall } = usePaywall();
  const [exporting, setExporting] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsSaving, setPrefsSaving] = useState(false);

  useEffect(() => {
    void getNotificationPreferences().then(setNotificationPrefs);
  }, []);

  const handlePreferenceChange = useCallback(
    async (key: keyof NotificationPreferences, value: boolean) => {
      if (!notificationPrefs || !user) {
        return;
      }

      const next = { ...notificationPrefs, [key]: value };
      setNotificationPrefs(next);
      setPrefsSaving(true);

      try {
        await saveNotificationPreferences(next);
        await applyNotificationPreferences(user.id, allHabits.map(mapHabitToNotifiable));
      } catch (e) {
        setNotificationPrefs(notificationPrefs);
        Alert.alert('Could not update', e instanceof Error ? e.message : 'Try again.');
      } finally {
        setPrefsSaving(false);
      }
    },
    [allHabits, notificationPrefs, user],
  );

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(
        'Notifications disabled',
        'Enable notifications in your device settings to receive habit reminders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ],
      );
    }
  };

  const handleExport = async () => {
    if (!isPro) {
      showPaywall();
      return;
    }

    if (!user) {
      return;
    }

    setExporting(true);
    try {
      await exportHabitsCSV(user.id);
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Could not export data.');
    } finally {
      setExporting(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void signOut().then(() => router.replace('/(auth)/sign-in'));
        },
      },
    ]);
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{user?.email ?? '—'}</Text>
          </View>
          <Pressable style={styles.rowButton} onPress={handleSignOut}>
            <Text style={styles.destructiveText}>Sign out</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Subscription</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Plan</Text>
            <Text style={[styles.rowValue, isPro && styles.proBadge]}>
              {isPro ? 'Rivo Pro' : 'Free'}
            </Text>
          </View>
          {!isPro ? (
            <Pressable style={styles.rowButton} onPress={showPaywall}>
              <Text style={styles.actionText}>Upgrade to Pro</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>
          ) : (
            <Text style={styles.hint}>Status: {subscriptionStatus}</Text>
          )}
        </View>

        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.section}>
          {notificationPrefs ? (
            <>
              <View style={styles.toggleRow}>
                <View style={styles.toggleText}>
                  <Text style={styles.rowLabel}>Habit reminders</Text>
                  <Text style={styles.rowHint}>Daily reminders for each habit</Text>
                </View>
                <Switch
                  value={notificationPrefs.habitReminders}
                  onValueChange={(value) => void handlePreferenceChange('habitReminders', value)}
                  disabled={prefsSaving}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <View style={styles.toggleRow}>
                <View style={styles.toggleText}>
                  <Text style={styles.rowLabel}>Streak alerts</Text>
                  <Text style={styles.rowHint}>Prominent reminders when streak is 7+ days</Text>
                </View>
                <Switch
                  value={notificationPrefs.streakAlerts}
                  onValueChange={(value) => void handlePreferenceChange('streakAlerts', value)}
                  disabled={prefsSaving || !notificationPrefs.habitReminders}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <View style={styles.toggleRow}>
                <View style={styles.toggleText}>
                  <Text style={styles.rowLabel}>Follow-up reminders</Text>
                  <Text style={styles.rowHint}>Nudge 2 hours after a missed reminder</Text>
                </View>
                <Switch
                  value={notificationPrefs.followUpReminders}
                  onValueChange={(value) => void handlePreferenceChange('followUpReminders', value)}
                  disabled={prefsSaving || !notificationPrefs.habitReminders}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <View style={styles.toggleRow}>
                <View style={styles.toggleText}>
                  <Text style={styles.rowLabel}>Daily summary</Text>
                  <Text style={styles.rowHint}>End-of-day recap at 9:00 PM</Text>
                </View>
                <Switch
                  value={notificationPrefs.dailySummary}
                  onValueChange={(value) => void handlePreferenceChange('dailySummary', value)}
                  disabled={prefsSaving}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </>
          ) : (
            <View style={styles.row}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
          <Pressable style={styles.rowButton} onPress={() => void handleRequestPermission()}>
            <Text style={styles.actionText}>Enable notifications</Text>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          </Pressable>
          <Pressable style={styles.rowButton} onPress={() => void Linking.openSettings()}>
            <Text style={styles.rowLabel}>System notification settings</Text>
            <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Data</Text>
        <View style={styles.section}>
          <Pressable
            style={styles.rowButton}
            onPress={() => void handleExport()}
            disabled={exporting}
          >
            <View>
              <Text style={styles.actionText}>Export data</Text>
              <Text style={styles.rowHint}>CSV of all completions {isPro ? '' : '(Pro)'}</Text>
            </View>
            {exporting ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name="share-outline" size={20} color={colors.primary} />
            )}
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>{appVersion}</Text>
          </View>
        </View>

        {__DEV__ ? (
          <>
            <Text style={styles.sectionLabel}>Developer</Text>
            <View style={styles.section}>
              <Pressable
                style={styles.rowButton}
                onPress={() => {
                  void resetOnboardingForDev().then(() => router.replace('/onboarding'));
                }}
              >
                <Text style={styles.devResetText}>Reset onboarding (dev)</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  toggleText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    color: colors.text,
  },
  rowValue: {
    fontSize: 15,
    color: colors.textSecondary,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  proBadge: {
    color: colors.primary,
    fontWeight: '700',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  rowHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    padding: spacing.md,
    paddingTop: 0,
  },
  destructiveText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
  devResetText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ff4444',
  },
});
