import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressRing } from '../../components/ProgressRing';
import { authColors } from '../../constants/authTheme';
import { markOnboardingComplete, markOnboardingJustFinished } from '../../lib/onboarding';
import {
  markNotificationPermissionSeen,
  requestNotificationPermission,
} from '../../lib/notifications';

const FEATURES = [
  {
    icon: 'today-outline' as const,
    title: 'Track your day',
    body: 'Morning, afternoon, and evening habits in one view',
  },
  {
    icon: 'bar-chart-outline' as const,
    title: 'See your patterns',
    body: 'Weekday vs weekend breakdown shows where habits slip',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'AI weekly debrief',
    body: 'Claude analyzes your data and gives specific insight',
  },
];

async function finishOnboarding(requestNotifications: boolean) {
  if (requestNotifications) {
    await requestNotificationPermission();
  }
  await markNotificationPermissionSeen();
  await markOnboardingComplete();
  await markOnboardingJustFinished();
  router.replace('/(auth)/sign-in');
}

function DotIndicators({ count, active }: { count: number; active: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.dot, index === active && styles.dotActive]} />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const [screen, setScreen] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const goToNext = () => {
    if (screen >= 2) {
      return;
    }

    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setScreen((current) => current + 1);
      slideAnim.setValue(0);
    });
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const handleFinish = (requestNotifications: boolean) => {
    if (finishing) {
      return;
    }

    setFinishing(true);
    void finishOnboarding(requestNotifications).finally(() => setFinishing(false));
  };

  const renderScreen = () => {
    if (screen === 0) {
      return (
        <>
          <Text style={styles.wordmark}>Rivo</Text>
          <View style={styles.illustration}>
            <ProgressRing progress={0.65} size={160} strokeWidth={10} accentColor={authColors.accent} />
          </View>
          <Text style={styles.headline}>Build habits that actually stick.</Text>
          <Text style={styles.subtext}>
            Morning, afternoon, evening — Rivo keeps you on track all day.
          </Text>
          <View style={styles.footer}>
            <DotIndicators count={3} active={screen} />
            <Pressable style={styles.primaryButton} onPress={goToNext}>
              <Text style={styles.primaryButtonText}>Get started</Text>
            </Pressable>
            <Pressable onPress={() => router.replace('/(auth)/sign-in')}>
              <Text style={styles.ghostLink}>I already have an account</Text>
            </Pressable>
          </View>
        </>
      );
    }

    if (screen === 1) {
      return (
        <>
          <Text style={styles.screenEyebrow}>Features</Text>
          <Text style={styles.sectionTitle}>Everything you need</Text>
          <Text style={styles.sectionSubtitle}>
            Simple tools that help you show up every day.
          </Text>

          <View style={styles.features}>
            {FEATURES.map((feature) => (
              <View key={feature.title} style={styles.featureCard}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={feature.icon} size={22} color={authColors.accent} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureBody}>{feature.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <DotIndicators count={3} active={screen} />
            <Pressable style={styles.primaryButton} onPress={goToNext}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </Pressable>
          </View>
        </>
      );
    }

    if (screen === 2) {
      return (
        <>
          <Text style={styles.screenEyebrow}>Notifications</Text>
          <Text style={styles.sectionTitle}>Never miss a habit</Text>
          <Text style={styles.sectionSubtitle}>
            Rivo sends one reminder per habit. Nothing else.
          </Text>

          <View style={styles.notificationHero}>
            <View style={styles.bellCircle}>
              <Ionicons name="notifications" size={40} color={authColors.accent} />
            </View>

            <View style={styles.notificationCard}>
              <View style={styles.notificationRow}>
                <Ionicons name="alarm-outline" size={18} color={authColors.accent} />
                <Text style={styles.notificationRowText}>One reminder per habit, at your chosen time</Text>
              </View>
              <View style={styles.notificationRow}>
                <Ionicons name="time-outline" size={18} color={authColors.accent} />
                <Text style={styles.notificationRowText}>Optional follow-up if you forget</Text>
              </View>
              <View style={styles.notificationRow}>
                <Ionicons name="moon-outline" size={18} color={authColors.accent} />
                <Text style={styles.notificationRowText}>Daily summary at 9 PM</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <DotIndicators count={3} active={screen} />
            <Pressable
              style={[styles.primaryButton, finishing && styles.buttonDisabled]}
              onPress={() => handleFinish(true)}
              disabled={finishing}
            >
              <Text style={styles.primaryButtonText}>
                {finishing ? 'Setting up…' : 'Allow notifications'}
              </Text>
            </Pressable>
            <Pressable onPress={() => handleFinish(false)} disabled={finishing}>
              <Text style={styles.ghostLink}>Not now</Text>
            </Pressable>
          </View>
        </>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View
        style={[
          styles.page,
          {
            opacity,
            transform: [{ translateX }],
          },
        ]}
      >
        {renderScreen()}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: authColors.background,
  },
  page: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '800',
    color: authColors.accent,
    textAlign: 'center',
    marginBottom: 24,
  },
  illustration: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: authColors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtext: {
    fontSize: 16,
    lineHeight: 24,
    color: authColors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: authColors.text,
    marginBottom: 8,
  },
  screenEyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: authColors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: authColors.textSecondary,
    marginBottom: 28,
  },
  features: {
    flex: 1,
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: authColors.accent,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: authColors.text,
    marginBottom: 4,
  },
  featureBody: {
    fontSize: 14,
    lineHeight: 21,
    color: authColors.textSecondary,
  },
  bellCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  notificationHero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  notificationCard: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    gap: 14,
    borderLeftWidth: 4,
    borderLeftColor: authColors.accent,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationRowText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: authColors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  footer: {
    gap: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3f3f46',
  },
  dotActive: {
    backgroundColor: authColors.accent,
    width: 24,
  },
  primaryButton: {
    backgroundColor: authColors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: authColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  ghostLink: {
    color: authColors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
