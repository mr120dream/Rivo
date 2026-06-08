import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type WelcomeBackBannerProps = {
  name?: string;
  streak?: number;
  onDismiss?: () => void;
};

export function WelcomeBackBanner({ name, streak, onDismiss }: WelcomeBackBannerProps) {
  const [visible, setVisible] = useState(true);
  const opacity = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onDismiss, opacity]);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) {
    return null;
  }

  return (
    <Pressable onPress={handleDismiss}>
      <Animated.View
        style={[
          styles.banner,
          {
            opacity,
          },
        ]}
      >
        <Text style={styles.emoji}>👋</Text>
        <View style={styles.textBlock}>
          <Text style={styles.title}>
            Welcome back{name ? `, ${name.split('@')[0]}` : ''}!
          </Text>
          {streak != null && streak > 0 ? (
            <Text style={styles.subtitle}>🔥 You're on a {streak}-day streak. Keep it going.</Text>
          ) : (
            <Text style={styles.subtitle}>Ready to build on yesterday?</Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 24,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 2,
  },
});
