import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast } from '../../components/Toast';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { FREQUENCY_OPTIONS } from '../../lib/habitSchedule';
import { HABIT_ICONS, TIME_OF_DAY_OPTIONS } from '../../constants/habitIcons';
import { colors, radii, spacing } from '../../constants/theme';
import { useHabits } from '../../contexts/HabitsContext';
import { getHabitIconName } from '../../lib/utils';
import { HabitFrequency, HabitIcon, TimeOfDay } from '../../types/habit';

function formatReminderDate(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function parseReminderTime(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export default function AddHabitScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditing = Boolean(editId);
  const { addHabit, updateHabit, getHabitById, loading: habitsLoading } = useHabits();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState<HabitIcon>('leaf');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [reminderDate, setReminderDate] = useState(new Date(new Date().setHours(8, 0, 0, 0)));
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formReady, setFormReady] = useState(!editId);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) {
      setFormReady(true);
      return;
    }

    if (habitsLoading) {
      return;
    }

    const habit = getHabitById(editId);
    if (!habit) {
      setError('Habit not found.');
      setFormReady(true);
      return;
    }

    setName(habit.name);
    setIcon(habit.icon);
    setTimeOfDay(habit.timeOfDay);
    setFrequency(habit.frequency);
    setReminderDate(parseReminderTime(habit.reminderTime));
    setError(null);
    setFormReady(true);
  }, [editId, habitsLoading, getHabitById]);

  const handleReminderChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selected) {
      setReminderDate(selected);
    }
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a habit name.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      name: trimmedName,
      icon,
      timeOfDay,
      reminderTime: formatReminderDate(reminderDate),
      reminderEnabled: true,
      frequency,
    };

    try {
      if (isEditing && editId) {
        await updateHabit(editId, payload);
        setToastMessage('Habit updated');
        setTimeout(() => router.navigate('/(tabs)/'), 400);
      } else {
        await addHabit(payload);
        router.navigate('/(tabs)/');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save habit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safe} edges={['top']}>
      <Toast message={toastMessage} onHide={() => setToastMessage(null)} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{isEditing ? 'Edit habit' : 'Add habit'}</Text>
          <Text style={styles.subtitle}>
            {isEditing
              ? submitting
                ? 'Saving…'
                : 'Changes save to your account and update your reminder.'
              : 'Saved to your account with a daily reminder.'}
          </Text>

          {!formReady ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Morning meditation"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconGrid}>
            {HABIT_ICONS.map((option) => {
              const selected = icon === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.iconOption, selected && styles.iconOptionSelected]}
                  onPress={() => setIcon(option.id)}
                >
                  <Ionicons
                    name={getHabitIconName(option.id)}
                    size={22}
                    color={selected ? colors.primary : colors.textSecondary}
                  />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Time of day</Text>
          <View style={styles.chipRow}>
            {TIME_OF_DAY_OPTIONS.map((option) => {
              const selected = timeOfDay === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setTimeOfDay(option.id)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Frequency</Text>
          <View style={styles.chipRow}>
            {FREQUENCY_OPTIONS.map((option) => {
              const selected = frequency === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setFrequency(option.id)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Reminder time</Text>
          <Pressable style={styles.timeButton} onPress={() => setShowPicker(true)}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.timeButtonText}>{formatReminderDate(reminderDate)}</Text>
          </Pressable>

          {showPicker ? (
            <DateTimePicker
              value={reminderDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleReminderChange}
            />
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.submitButton, submitting && styles.buttonDisabled]}
            onPress={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.submitButtonText}>{isEditing ? 'Save changes' : 'Save habit'}</Text>
            )}
          </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  loader: {
    marginTop: spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  chipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  error: {
    color: colors.error,
    marginTop: spacing.md,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
