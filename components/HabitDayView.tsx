import { type ReactNode } from 'react';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HabitCard } from './HabitCard';
import { ProgressRing } from './ProgressRing';
import { colors, radii, spacing } from '../constants/theme';
import { formatDateHeader } from '../lib/utils';
import { Habit } from '../types/habit';

type HabitDayViewProps = {
  title: string;
  date: Date;
  habits: Habit[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onToggle: (id: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => Promise<void>;
  completedCount: number;
  progress: number;
  emptyTitle: string;
  emptyBody: string;
  showAddButton?: boolean;
  headerExtra?: ReactNode;
};

export function HabitDayView({
  title,
  date,
  habits,
  loading,
  error,
  onRetry,
  onToggle,
  onEdit,
  onDelete,
  completedCount,
  progress,
  emptyTitle,
  emptyBody,
  showAddButton = false,
  headerExtra,
}: HabitDayViewProps) {
  const dateLabel = formatDateHeader(date);

  const handleDelete = (habit: Habit) => {
    Alert.alert('Delete habit?', `Remove "${habit.name}"? This keeps your history but stops reminders.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void onDelete(habit.id).catch((e) => {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete habit.');
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{title}</Text>
            <Text style={styles.date}>{dateLabel}</Text>
            {headerExtra}
          </View>
          <ProgressRing progress={progress} />
        </View>

        {error ? (
          <Pressable style={styles.errorBanner} onPress={onRetry}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Tap to retry</Text>
          </Pressable>
        ) : null}

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {completedCount} of {habits.length} habits complete
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Your habits</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : habits.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyBody}>{emptyBody}</Text>
            {showAddButton ? (
              <Pressable
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/add-habit')}
              >
                <Text style={styles.emptyButtonText}>Add a habit</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  date: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 4,
  },
  retryText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  loadingWrap: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  emptyButtonText: {
    color: colors.surface,
    fontWeight: '600',
  },
});
