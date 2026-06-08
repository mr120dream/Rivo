import { useRouter, useSegments } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useWelcomeBack } from '../contexts/WelcomeBackContext';
import {
  resolveOnboardingGate,
  shouldShowWelcomeBack,
  getLastSeenTimestamp,
  updateLastSeenTimestamp,
} from '../lib/onboarding';

export function AppBootstrap() {
  const { user, loading } = useAuth();
  const { setShowWelcomeBack } = useWelcomeBack();
  const router = useRouter();
  const segments = useSegments();
  const checkingReturnRef = useRef(false);

  const checkReturningUser = useCallback(async () => {
    if (!user || checkingReturnRef.current) {
      return;
    }

    checkingReturnRef.current = true;

    try {
      const onboardingDone = await resolveOnboardingGate(true);
      if (!onboardingDone) {
        return;
      }

      const lastSeen = await getLastSeenTimestamp();
      if (shouldShowWelcomeBack(lastSeen)) {
        setShowWelcomeBack(true);
      }

      await updateLastSeenTimestamp();
    } finally {
      checkingReturnRef.current = false;
    }
  }, [user, setShowWelcomeBack]);

  useEffect(() => {
    if (loading) {
      return;
    }

    let cancelled = false;

    async function gateOnboarding() {
      const onboardingDone = await resolveOnboardingGate(Boolean(user));
      if (cancelled) {
        return;
      }

      if (user && onboardingDone) {
        if (segments[0] === 'onboarding') {
          router.replace('/');
        }
        return;
      }

      if (!onboardingDone) {
        const onAllowedRoute =
          segments[0] === 'onboarding' || segments[0] === '(auth)';

        if (!onAllowedRoute) {
          router.replace('/onboarding');
        }
        return;
      }
    }

    void gateOnboarding();

    return () => {
      cancelled = true;
    };
  }, [loading, router, segments, user]);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    void checkReturningUser();
  }, [loading, user, checkReturningUser]);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void checkReturningUser();
      }
    });

    return () => subscription.remove();
  }, [loading, user, checkReturningUser]);

  return null;
}
