import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { authColors } from '../constants/authTheme';
import { useAuth } from '../contexts/AuthContext';
import { isOnboardingComplete } from '../lib/onboarding';
import { hasSeenNotificationPermission } from '../lib/notifications';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Index() {
  const { session, loading } = useAuth();
  const [routeReady, setRouteReady] = useState(false);
  const [needsNotificationPrompt, setNeedsNotificationPrompt] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    isOnboardingComplete()
      .then((complete) => {
        if (!cancelled) {
          setOnboardingComplete(complete);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOnboardingComplete(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setNeedsNotificationPrompt(false);
      setRouteReady(true);
      return;
    }

    let cancelled = false;

    hasSeenNotificationPermission()
      .then((seen) => {
        if (!cancelled) {
          setNeedsNotificationPrompt(!seen);
          setRouteReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNeedsNotificationPrompt(false);
          setRouteReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  if (!isSupabaseConfigured) {
    return <Redirect href="/config-required" />;
  }

  if (loading || onboardingComplete === null || (session && !routeReady)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={authColors.accent} />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (needsNotificationPrompt) {
    return <Redirect href="/notification-permission" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authColors.background,
  },
});
