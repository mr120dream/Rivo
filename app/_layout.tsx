import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppBootstrap } from '../components/AppBootstrap';
import { CelebrationHost } from '../components/CelebrationHost';
import { FirstHabitCelebrationHost } from '../components/FirstHabitCelebrationHost';
import { NotificationLifecycle } from '../components/NotificationLifecycle';
import { NotificationResponseHandler } from '../components/NotificationResponseHandler';
import { SubscriptionLifecycle } from '../components/SubscriptionLifecycle';
import { authColors } from '../constants/authTheme';
import { AuthProvider } from '../contexts/AuthContext';
import { HabitsProvider } from '../contexts/HabitsContext';
import { PaywallProvider } from '../contexts/PaywallContext';
import { WelcomeBackProvider } from '../contexts/WelcomeBackContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <WelcomeBackProvider>
        <PaywallProvider>
          <HabitsProvider>
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
          </HabitsProvider>
        </PaywallProvider>
      </WelcomeBackProvider>
    </AuthProvider>
  );
}
