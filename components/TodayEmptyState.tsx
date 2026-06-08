import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProgressRing } from './ProgressRing';
import { colors, radii, spacing } from '../constants/theme';

const STARTER_IDEAS = [
  { label: 'Drink water', icon: 'water-outline' as const },
  { label: 'Morning walk', icon: 'walk-outline' as const },
  { label: 'Read 10 minutes', icon: 'book-outline' as const },
];

type TodayEmptyStateProps = {
  variant: 'no-habits' | 'nothing-scheduled';
};

export function TodayEmptyState({ variant }: TodayEmptyStateProps) {
  if (variant === 'no-habits') {
    return (
      <View style={styles.container}>
        <View style={styles.hero}>
          <ProgressRing progress={0} size={120} strokeWidth={10} accentColor="#6366f1" />
        </View>

        <Text style={styles.headline}>Your streak starts with one habit.</Text>
        <Text style={styles.body}>
          Pick something small you can do every day. Rivo reminds you once, tracks your progress,
          and celebrates when you keep the chain going.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/(tabs)/add-habit')}
        >
          <Text style={styles.primaryButtonText}>Create your first habit</Text>
        </Pressable>

        <Text style={styles.starterLabel}>Popular starters</Text>
        <View style={styles.starterRow}>
          {STARTER_IDEAS.map((idea) => (
            <Pressable
              key={idea.label}
              style={styles.starterChip}
              onPress={() => router.push('/(tabs)/add-habit')}
            >
              <Ionicons name={idea.icon} size={16} color={colors.primary} />
              <Text style={styles.starterText}>{idea.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="sunny-outline" size={36} color={colors.primary} />
      </View>

      <Text style={styles.headline}>Nothing on the schedule today.</Text>
      <Text style={styles.body}>
        Your habits run on other days — that's the plan working. Check Tomorrow to pre-complete, or
        add a daily habit that fits every day.
      </Text>

      <Pressable style={styles.primaryButton} onPress={() => router.push('/(tabs)/tomorrow')}>
        <Text style={styles.primaryButtonText}>View Tomorrow</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.push('/(tabs)/add-habit')}>
        <Text style={styles.secondaryButtonText}>Add a daily habit</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  hero: {
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: spacing.sm,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  starterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  starterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  starterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  starterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
});
