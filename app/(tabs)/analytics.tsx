import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkeletonCard } from '../../components/SkeletonCard';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { colors, radii, spacing } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { usePaywall } from '../../contexts/PaywallContext';
import { fetchWeeklyAnalytics, generateDebrief, type WeeklyAnalytics } from '../../lib/analytics';

export default function AnalyticsScreen() {
  const { user, isPro } = useAuth();
  const { showPaywall } = usePaywall();
  const [analytics, setAnalytics] = useState<WeeklyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [debrief, setDebrief] = useState<string | null>(null);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchWeeklyAnalytics(user.id);
      setAnalytics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const handleGenerateDebrief = async () => {
    if (!isPro) {
      showPaywall();
      return;
    }

    if (!user) {
      return;
    }

    setDebriefLoading(true);
    setError(null);

    try {
      const summary = await generateDebrief(user.id);
      setDebrief(summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate debrief.');
    } finally {
      setDebriefLoading(false);
    }
  };

  if (!isPro) {
    return (
      <ErrorBoundary>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.lockedContainer}>
            <View style={styles.lockIcon}>
              <Ionicons name="bar-chart-outline" size={36} color={colors.primary} />
            </View>
            <Text style={styles.lockedTitle}>Analytics & Debrief</Text>
            <Text style={styles.lockedBody}>
              Upgrade to Rivo Pro for weekly trends, streak insights, and your personalized Claude
              debrief.
            </Text>
            <Pressable style={styles.upgradeButton} onPress={showPaywall}>
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Your last 7 days at a glance</Text>

        {loading ? (
          <View style={styles.skeletonWrap}>
            <View style={styles.statGrid}>
              <SkeletonCard width="31%" height={88} />
              <SkeletonCard width="31%" height={88} />
              <SkeletonCard width="31%" height={88} />
            </View>
            <SkeletonCard height={56} />
            <SkeletonCard height={56} />
            <SkeletonCard height={120} />
          </View>
        ) : analytics ? (
          <>
            <View style={styles.statGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {Math.round(analytics.completionRate * 100)}%
                </Text>
                <Text style={styles.statLabel}>Completion rate</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{analytics.totalCompletions}</Text>
                <Text style={styles.statLabel}>Completions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{analytics.completedDays}</Text>
                <Text style={styles.statLabel}>Active days</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Streaks</Text>
            {analytics.streaks.length === 0 ? (
              <Text style={styles.emptyText}>Complete habits to start building streaks.</Text>
            ) : (
              analytics.streaks.map((streak) => (
                <View key={streak.habitId} style={styles.streakRow}>
                  <Text style={styles.streakName}>{streak.name}</Text>
                  <Text style={styles.streakMeta}>
                    {streak.currentStreak} day current · {streak.longestStreak} best
                  </Text>
                </View>
              ))
            )}

            <Text style={styles.sectionTitle}>Claude debrief</Text>
            <Text style={styles.debriefIntro}>
              Get a personalized weekly reflection powered by Claude.
            </Text>

            {debrief ? (
              <View style={styles.debriefCard}>
                <Text style={styles.debriefText}>{debrief}</Text>
              </View>
            ) : null}

            <Pressable
              style={[styles.debriefButton, debriefLoading && styles.buttonDisabled]}
              onPress={() => void handleGenerateDebrief()}
              disabled={debriefLoading}
            >
              {debriefLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Ionicons name="sparkles-outline" size={18} color={colors.surface} />
                  <Text style={styles.debriefButtonText}>
                    {debrief ? 'Regenerate debrief' : 'Generate weekly debrief'}
                  </Text>
                </>
              )}
            </Pressable>
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
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
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    marginTop: 4,
  },
  skeletonWrap: {
    gap: spacing.sm,
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  streakRow: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  streakMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  debriefIntro: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  debriefCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  debriefText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
  },
  debriefButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
  },
  debriefButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  error: {
    color: colors.error,
    marginTop: spacing.md,
    fontSize: 14,
  },
  lockedContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  lockedBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  upgradeButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
