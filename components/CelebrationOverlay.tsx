import * as Haptics from 'expo-haptics';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { authColors } from '../constants/authTheme';

export type CelebrationData = {
  totalHabits: number;
  streak: number;
};

type CelebrationOverlayProps = {
  visible: boolean;
  data: CelebrationData | null;
  onDismiss: () => void;
};

export function CelebrationOverlay({ visible, data, onDismiss }: CelebrationOverlayProps) {
  if (!data) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>All done for today!</Text>
          <Text style={styles.body}>You completed all {data.totalHabits} habits</Text>
          {data.streak > 0 ? (
            <Text style={styles.streak}>🔥 {data.streak} day streak!</Text>
          ) : null}
          <Text style={styles.hint}>Tap anywhere to dismiss</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

export async function playCelebrationHaptic(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
  },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: authColors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 17,
    color: authColors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  streak: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 8,
  },
  hint: {
    fontSize: 13,
    color: authColors.textSecondary,
    marginTop: 32,
  },
});
