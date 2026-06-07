import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { hasSeenNotificationPermission } from '../lib/notifications';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Index() {
  const { session, loading } = useAuth();
  const [routeReady, setRouteReady] = useState(false);
  const [needsNotificationPrompt, setNeedsNotificationPrompt] = useState(false);

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

  if (loading || !routeReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
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
    backgroundColor: colors.background,
  },
});
