import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { authColors } from '../constants/authTheme';

export type FirstHabitCelebrationData = {
  reminderTime: string | null;
};

type FirstHabitCelebrationOverlayProps = {
  visible: boolean;
  data: FirstHabitCelebrationData | null;
  onDismiss: () => void;
};

function formatReminderTime(time: string | null): string {
  if (!time) {
    return 'your chosen time';
  }
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function FirstHabitCelebrationOverlay({
  visible,
  data,
  onDismiss,
}: FirstHabitCelebrationOverlayProps) {
  useEffect(() => {
    if (!visible || !data) {
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [visible, data, onDismiss]);

  if (!data) {
    return null;
  }

  const handleAddAnother = () => {
    onDismiss();
    router.push('/(tabs)/add-habit');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.content} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>Your first habit is set!</Text>
          <Text style={styles.body}>
            Rivo will remind you at {formatReminderTime(data.reminderTime)}.
          </Text>
          <Text style={styles.hint}>Now add a few more to build your routine.</Text>

          <Pressable style={styles.primaryButton} onPress={handleAddAnother}>
            <Text style={styles.primaryButtonText}>Add another habit</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onDismiss}>
            <Text style={styles.secondaryButtonText}>I'm good for now</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 13, 13, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: authColors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: authColors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 15,
    color: authColors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: authColors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
