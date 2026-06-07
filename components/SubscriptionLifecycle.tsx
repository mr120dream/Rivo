import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export function SubscriptionLifecycle() {
  const { user, refreshSubscription } = useAuth();

  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      return;
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshSubscription();
      }
    });

    return () => subscription.remove();
  }, [user, refreshSubscription]);

  return null;
}
