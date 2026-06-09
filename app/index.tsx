import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { authColors } from '../constants/authTheme';
import { useAuth } from '../contexts/AuthContext';
import { hasSeenNotificationPermission } from '../lib/notifications';
import { isOnboardingComplete } from '../lib/onboarding';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Index() {
  const { session, loading } = useAuth();
  const [routeReady, setRouteReady] = useState(false);
  const [bootstrapReady, setBootstrapReady] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [needsNotificationPrompt, setNeedsNotificationPrompt] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    let cancelled = false;

    isOnboardingComplete()
      .then((done) => {
        if (!cancelled) {
          setOnboardingDone(done);
          setBootstrapReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBootstrapReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loading]);

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

  if (loading || !bootstrapReady || (session && !routeReady)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={authColors.accent} />
      </View>
    );
  }

  if (!onboardingDone) {
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
