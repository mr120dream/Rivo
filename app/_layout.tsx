import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NotificationLifecycle } from '../components/NotificationLifecycle';
import { SubscriptionLifecycle } from '../components/SubscriptionLifecycle';
import { AuthProvider } from '../contexts/AuthContext';
import { HabitsProvider } from '../contexts/HabitsContext';
import { PaywallProvider } from '../contexts/PaywallContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaywallProvider>
        <HabitsProvider>
          <SubscriptionLifecycle />
          <NotificationLifecycle />
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="config-required" />
            <Stack.Screen name="notification-permission" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </HabitsProvider>
      </PaywallProvider>
    </AuthProvider>
  );
}