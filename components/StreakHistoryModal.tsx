import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../constants/theme';
import type { HabitStreakHistory } from '../lib/habits';

type StreakHistoryModalProps = {
  visible: boolean;
  habitName: string;
  loading: boolean;
  history: HabitStreakHistory | null;
  error: string | null;
  onClose: () => void;
};

export function StreakHistoryModal({
  visible,
  habitName,
  loading,
  history,
  error,
  onClose,
}: StreakHistoryModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Streak history</Text>
          <Text style={styles.habitName}>{habitName}</Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : history ? (
            <>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{history.currentStreak}</Text>
                  <Text style={styles.statLabel}>Current</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{history.longestStreak}</Text>
                  <Text style={styles.statLabel}>Best</Text>
                </View>
              </View>

              {history.lastCompletedDate ? (
                <Text style={styles.lastDone}>
                  Last completed: {history.lastCompletedDate}
                </Text>
              ) : null}

              <Text style={styles.recentLabel}>Recent completions</Text>
              {history.recentDates.length === 0 ? (
                <Text style={styles.empty}>No completions yet.</Text>
              ) : (
                history.recentDates.map((date) => (
                  <View key={date} style={styles.dateRow}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.dateText}>{date}</Text>
                  </View>
                ))
              )}
            </>
          ) : null}

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  habitName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  error: {
    color: colors.error,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  lastDone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  recentLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  empty: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: 14,
    color: colors.text,
  },
  closeButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
