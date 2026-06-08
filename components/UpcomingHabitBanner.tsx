import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { authColors } from '../constants/authTheme';
import { spacing } from '../constants/theme';
import { Habit } from '../types/habit';
import { getHabitIconName } from '../lib/utils';

type UpcomingHabitBannerProps = {
  label: string;
  habit: Habit;
  timeText: string;
  onPress?: () => void;
};

export function UpcomingHabitBanner({ label, habit, timeText, onPress }: UpcomingHabitBannerProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.sectionLabel}>{label}</Text>

      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name={getHabitIconName(habit.icon)} size={20} color={authColors.accent} />
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {habit.name}
        </Text>

        <Text style={styles.timeText}>{timeText}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: authColors.accent,
  },
  pressed: {
    opacity: 0.92,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: authColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: authColors.text,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: authColors.accent,
  },
});
