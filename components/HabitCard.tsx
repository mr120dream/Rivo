import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StreakHistoryModal } from './StreakHistoryModal';
import { colors, radii, spacing } from '../constants/theme';
import { fetchHabitStreakHistory, type HabitStreakHistory } from '../lib/habits';
import { formatReminderTime, formatTimeOfDay, getHabitIconName } from '../lib/utils';
import { Habit } from '../types/habit';

const SWIPE_OPEN = -88;
const SWIPE_TRIGGER = -56;

type HabitCardProps = {
  habit: Habit;
  onToggle: (id: string) => void;
  onEdit?: (habit: Habit) => void;
  onDelete?: (habit: Habit) => void;
};

export function HabitCard({ habit, onToggle, onEdit, onDelete }: HabitCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const swipeOpenRef = useRef(false);
  const [streakVisible, setStreakVisible] = useState(false);
  const [streakLoading, setStreakLoading] = useState(false);
  const [streakHistory, setStreakHistory] = useState<HabitStreakHistory | null>(null);
  const [streakError, setStreakError] = useState<string | null>(null);

  const closeSwipe = () => {
    swipeOpenRef.current = false;
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
  };

  const openSwipe = () => {
    swipeOpenRef.current = true;
    Animated.spring(translateX, { toValue: SWIPE_OPEN, useNativeDriver: true, bounciness: 0 }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx < 0) {
          translateX.setValue(Math.max(gesture.dx, SWIPE_OPEN));
        } else if (swipeOpenRef.current) {
          translateX.setValue(Math.min(SWIPE_OPEN + gesture.dx, 0));
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < SWIPE_TRIGGER || (swipeOpenRef.current && gesture.dx < 20)) {
          openSwipe();
          return;
        }
        closeSwipe();
      },
    }),
  ).current;

  const confirmDelete = () => {
    closeSwipe();
    Alert.alert('Delete habit?', `Remove "${habit.name}"? This keeps your history but stops reminders.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete?.(habit),
      },
    ]);
  };

  const openStreakHistory = () => {
    setStreakVisible(true);
    setStreakLoading(true);
    setStreakError(null);
    setStreakHistory(null);

    void fetchHabitStreakHistory(habit.id)
      .then(setStreakHistory)
      .catch((e) => {
        setStreakError(e instanceof Error ? e.message : 'Failed to load streak history.');
      })
      .finally(() => setStreakLoading(false));
  };

  const showActionSheet = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const options = ['Edit', 'View streak history', 'Delete', 'Cancel'];
    const destructiveButtonIndex = 2;
    const cancelButtonIndex = 3;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
          title: habit.name,
        },
        (index) => {
          if (index === 0) {
            onEdit?.(habit);
          } else if (index === 1) {
            openStreakHistory();
          } else if (index === 2) {
            confirmDelete();
          }
        },
      );
      return;
    }

    Alert.alert(habit.name, undefined, [
      { text: 'Edit', onPress: () => onEdit?.(habit) },
      { text: 'View streak history', onPress: openStreakHistory },
      { text: 'Delete', style: 'destructive', onPress: confirmDelete },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handlePress = () => {
    if (swipeOpenRef.current) {
      closeSwipe();
      return;
    }

    if (habit.completed) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onToggle(habit.id);
  };

  return (
    <>
      <View style={styles.wrapper}>
        <View style={styles.deleteAction}>
          <Pressable style={styles.deleteButton} onPress={confirmDelete}>
            <Ionicons name="trash-outline" size={22} color="#ffffff" />
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </View>

        <Animated.View
          style={[styles.cardAnimated, { transform: [{ translateX }] }]}
          {...panResponder.panHandlers}
        >
          <Pressable
            onPress={handlePress}
            onLongPress={showActionSheet}
            delayLongPress={400}
            style={({ pressed }) => [
              styles.card,
              habit.completed && styles.cardCompleted,
              pressed && styles.cardPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${habit.name}, ${habit.completed ? 'completed' : 'not completed'}`}
            accessibilityHint="Tap to toggle, swipe left to delete, long press for more options"
          >
            <View style={[styles.iconWrap, habit.completed && styles.iconWrapCompleted]}>
              <Ionicons
                name={getHabitIconName(habit.icon)}
                size={22}
                color={habit.completed ? colors.success : colors.primary}
              />
            </View>

            <View style={styles.content}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, habit.completed && styles.nameCompleted]}>
                  {habit.name}
                </Text>
                {habit.currentStreak && habit.currentStreak >= 30 ? (
                  <Text style={styles.streakIndigo}>⚡ {habit.currentStreak} day streak</Text>
                ) : habit.currentStreak && habit.currentStreak >= 3 ? (
                  <Text style={styles.streakAmber}>🔥 {habit.currentStreak} day streak</Text>
                ) : null}
              </View>
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
        </Animated.View>
      </View>

      <StreakHistoryModal
        visible={streakVisible}
        habitName={habit.name}
        loading={streakLoading}
        history={streakHistory}
        error={streakError}
        onClose={() => setStreakVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  deleteAction: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: colors.error,
    borderRadius: radii.lg,
  },
  deleteButton: {
    width: 88,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardAnimated: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
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
  nameRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  streakAmber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  streakIndigo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  nameCompleted: {
    color: colors.success,
    textDecorationLine: 'line-through',
    textDecorationColor: colors.success,
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
