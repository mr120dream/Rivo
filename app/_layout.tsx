import { Stack } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, View, type AppStateStatus } from 'react-native';
import { AppBootstrap } from '../components/AppBootstrap';
import { CelebrationHost } from '../components/CelebrationHost';
import { FirstHabitCelebrationHost } from '../components/FirstHabitCelebrationHost';
import { NotificationLifecycle } from '../components/NotificationLifecycle';
import { NotificationResponseHandler } from '../components/NotificationResponseHandler';
import { SplashScreen } from '../components/SplashScreen';
import { SubscriptionLifecycle } from '../components/SubscriptionLifecycle';
import { authColors } from '../constants/authTheme';
import { AuthProvider } from '../contexts/AuthContext';
import { HabitsProvider } from '../contexts/HabitsContext';
import { PaywallProvider } from '../contexts/PaywallContext';
import { WelcomeBackProvider } from '../contexts/WelcomeBackContext';

void ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

function AppShell() {
  return (
    <>
      <AppBootstrap />
      <SubscriptionLifecycle />
      <NotificationLifecycle />
      <NotificationResponseHandler />
      <CelebrationHost />
      <FirstHabitCelebrationHost />
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: authColors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="config-required" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="notification-permission" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [launchReady, setLaunchReady] = useState(false);
  const [resumeSplashVisible, setResumeSplashVisible] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const handleLaunchFinish = useCallback(() => {
    setLaunchReady(true);
  }, []);

  const handleResumeFinish = useCallback(() => {
    setResumeSplashVisible(false);
  }, []);

  useEffect(() => {
    if (!launchReady) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground =
        appStateRef.current === 'background' || appStateRef.current === 'inactive';

      if (wasBackground && nextState === 'active') {
        setResumeSplashVisible(true);
      }

      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [launchReady]);

  if (!launchReady) {
    return <SplashScreen mode="launch" onFinish={handleLaunchFinish} />;
  }

  return (
    <AuthProvider>
      <WelcomeBackProvider>
        <PaywallProvider>
          <HabitsProvider>
            <View style={{ flex: 1 }}>
              <AppShell />
              {resumeSplashVisible ? (
                <SplashScreen mode="resume" onFinish={handleResumeFinish} />
              ) : null}
            </View>
          </HabitsProvider>
        </PaywallProvider>
      </WelcomeBackProvider>
    </AuthProvider>
  );
}
