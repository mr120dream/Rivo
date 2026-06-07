import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../constants/theme';
import { formatReminderTime, formatTimeOfDay, getHabitIconName } from '../lib/utils';
import { Habit } from '../types/habit';

type HabitCardProps = {
  habit: Habit;
  onToggle: (id: string) => void;
  onEdit?: (habit: Habit) => void;
  onDelete?: (habit: Habit) => void;
};

export function HabitCard({ habit, onToggle, onEdit, onDelete }: HabitCardProps) {
  const handlePress = () => {
    void Haptics.impactAsync(
      habit.completed
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium,
    );
    onToggle(habit.id);
  };

  const handleLongPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Alert.alert(habit.name, undefined, [
      {
        text: 'Edit',
        onPress: () => onEdit?.(habit),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete?.(habit),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={400}
      style={({ pressed }) => [
        styles.card,
        habit.completed && styles.cardCompleted,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${habit.name}, ${habit.completed ? 'completed' : 'not completed'}`}
      accessibilityHint="Tap to toggle completion, long press to edit or delete"
    >
      <View style={[styles.iconWrap, habit.completed && styles.iconWrapCompleted]}>
        <Ionicons
          name={getHabitIconName(habit.icon)}
          size={22}
          color={habit.completed ? colors.success : colors.primary}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, habit.completed && styles.nameCompleted]}>{habit.name}</Text>
        <Text style={styles.meta}>
          {formatTimeOfDay(habit.timeOfDay)} · {formatReminderTime(habit.reminderTime)}
        </Text>
      </View>

      <View style={[styles.check, habit.completed && styles.checkCompleted]}>
        {habit.completed ? (
          <Ionicons name="checkmark" size={18} color={colors.surface} />
        ) : (
          <View style={styles.checkEmpty} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCompleted: {
    backgroundColor: colors.successMuted,
    borderColor: '#A7F3D0',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconWrapCompleted: {
    backgroundColor: '#A7F3D0',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  nameCompleted: {
    color: colors.success,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  checkCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkEmpty: {
    width: 12,
    height: 12,
    borderRadius: radii.full,
    backgroundColor: 'transparent',
  },
});
