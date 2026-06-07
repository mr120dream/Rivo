import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import {
  markNotificationPermissionSeen,
  requestNotificationPermission,
} from '../lib/notifications';

export default function NotificationPermissionScreen() {
  const { session, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const goToToday = async () => {
    await markNotificationPermissionSeen();
    router.replace('/(tabs)/');
  };

  const handleAllow = async () => {
    setSubmitting(true);
    await requestNotificationPermission();
    setSubmitting(false);
    await goToToday();
  };

  const handleNotNow = async () => {
    await goToToday();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="notifications-outline" size={40} color={colors.primary} />
        </View>

        <Text style={styles.title}>Stay on track</Text>
        <Text style={styles.body}>
          Allow reminders so Rivo can nudge you when it&apos;s time for your habits. You can enable
          this later in Settings.
        </Text>

        <Pressable
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          onPress={() => void handleAllow()}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.primaryButtonText}>Allow</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => void handleNotNow()}
          disabled={submitting}
        >
          <Text style={styles.secondaryButtonText}>Not now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
