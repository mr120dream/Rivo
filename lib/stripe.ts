import { Linking } from 'react-native';
import { getSupabase } from './supabase';

export type SubscriptionPlan = 'monthly' | 'annual' | 'lifetime';
export type SubscriptionStatus = 'free' | 'pro' | 'lifetime';

export async function openPaywall(plan: SubscriptionPlan, userId: string): Promise<void> {
  const url = `https://pay.rivoapp.co?plan=${plan}&uid=${userId}`;
  await Linking.openURL(url);
}

export async function verifySubscription(userId: string): Promise<SubscriptionStatus> {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke('verify-subscription', {
    body: { userId },
  });

  if (error) {
    return 'free';
  }

  const status = (data?.status as SubscriptionStatus | undefined) ?? 'free';

  await supabase.from('profiles').update({ subscription_status: status }).eq('id', userId);

  return status;
}

export async function fetchSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', userId)
    .maybeSingle();

  const status = (data?.subscription_status as SubscriptionStatus | undefined) ?? 'free';
  return status;
}

export function isPro(status: string): boolean {
  return status === 'pro' || status === 'lifetime';
}
