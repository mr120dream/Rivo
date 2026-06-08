import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressRing } from '../../components/ProgressRing';
import { authColors } from '../../constants/authTheme';
import { markOnboardingComplete } from '../../lib/onboarding';
import {
  markNotificationPermissionSeen,
  requestNotificationPermission,
} from '../../lib/notifications';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FEATURES = [
  {
    icon: '⭕',
    title: 'Track your day',
    body: 'Morning, afternoon, and evening habits in one view',
  },
  {
    icon: '📊',
    title: 'See your patterns',
    body: 'Weekday vs weekend breakdown shows where habits slip',
  },
  {
    icon: '🤖',
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
  router.replace('/(auth)/sign-in');
}

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const goToPage = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setPage(index);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextPage = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (nextPage !== page) {
      setPage(nextPage);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        bounces={false}
      >
        {/* Screen 1 — Welcome */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <Text style={styles.wordmark}>Rivo</Text>

          <View style={styles.illustration}>
            <ProgressRing progress={0.65} size={160} strokeWidth={10} accentColor={authColors.accent} />
          </View>

          <Text style={styles.headline}>Build habits that actually stick.</Text>
          <Text style={styles.subtext}>
            Morning, afternoon, evening — Rivo keeps you on track all day.
          </Text>

          <View style={styles.footer}>
            <DotIndicators count={3} active={page} />
            <Pressable style={styles.primaryButton} onPress={() => goToPage(1)}>
              <Text style={styles.primaryButtonText}>Get started</Text>
            </Pressable>
            <Pressable onPress={() => void finishOnboarding(false)}>
              <Text style={styles.ghostLink}>I already have an account</Text>
            </Pressable>
          </View>
        </View>

        {/* Screen 2 — How it works */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <Text style={styles.sectionTitle}>How it works</Text>

          <View style={styles.features}>
            {FEATURES.map((feature) => (
              <View key={feature.title} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureBody}>{feature.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <DotIndicators count={3} active={page} />
            <Pressable style={styles.primaryButton} onPress={() => goToPage(2)}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </Pressable>
          </View>
        </View>

        {/* Screen 3 — Notifications */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <View style={styles.bellCircle}>
            <Ionicons name="notifications" size={36} color={authColors.accent} />
          </View>

          <Text style={styles.headline}>Never miss a habit</Text>
          <Text style={styles.subtext}>Rivo sends one reminder per habit. Nothing else.</Text>

          <View style={styles.footer}>
            <DotIndicators count={3} active={page} />
            <Pressable
              style={styles.primaryButton}
              onPress={() => void finishOnboarding(true)}
            >
              <Text style={styles.primaryButtonText}>Allow notifications</Text>
            </Pressable>
            <Pressable onPress={() => void finishOnboarding(false)}>
              <Text style={styles.ghostLink}>Not now</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DotIndicators({ count, active }: { count: number; active: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index === active && styles.dotActive]}
        />
      ))}
    </View>
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
    marginBottom: 32,
    marginTop: 8,
  },
  features: {
    flex: 1,
    gap: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureIcon: {
    fontSize: 28,
    width: 36,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: authColors.text,
    marginBottom: 4,
  },
  featureBody: {
    fontSize: 15,
    lineHeight: 22,
    color: authColors.textSecondary,
  },
  bellCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 48,
    marginBottom: 32,
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
