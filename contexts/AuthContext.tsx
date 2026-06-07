import { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchSubscriptionStatus,
  isPro as checkIsPro,
  SubscriptionStatus,
  verifySubscription,
} from '../lib/stripe';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscriptionStatus: SubscriptionStatus;
  isPro: boolean;
  subscriptionLoading: boolean;
  refreshSubscription: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithApple: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('free');
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const refreshSubscription = useCallback(async () => {
    if (!session?.user || !isSupabaseConfigured) {
      setSubscriptionStatus('free');
      return;
    }

    setSubscriptionLoading(true);
    try {
      const status = await verifySubscription(session.user.id);
      setSubscriptionStatus(status);
    } catch {
      const cached = await fetchSubscriptionStatus(session.user.id);
      setSubscriptionStatus(cached);
    } finally {
      setSubscriptionLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setSubscriptionStatus('free');
      return;
    }

    void fetchSubscriptionStatus(session.user.id).then(setSubscriptionStatus);
  }, [session?.user?.id]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      return { error: 'Apple Sign In is only available on iOS.' };
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        return { error: 'Apple Sign In did not return an identity token.' };
      }

      const { error } = await getSupabase().auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      return { error: error?.message ?? null };
    } catch (e) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code: string }).code === 'ERR_REQUEST_CANCELED'
      ) {
        return { error: null };
      }
      return { error: e instanceof Error ? e.message : 'Apple Sign In failed.' };
    }
  }, []);

  const signOut = useCallback(async () => {
    setSubscriptionStatus('free');
    await getSupabase().auth.signOut();
  }, []);

  const isPro = checkIsPro(subscriptionStatus);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      subscriptionStatus,
      isPro,
      subscriptionLoading,
      refreshSubscription,
      signUp,
      signIn,
      signInWithApple,
      signOut,
    }),
    [
      session,
      loading,
      subscriptionStatus,
      isPro,
      subscriptionLoading,
      refreshSubscription,
      signUp,
      signIn,
      signInWithApple,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
