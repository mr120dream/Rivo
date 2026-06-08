import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_COMPLETE_KEY = 'rivo_onboarding_complete';
export const ONBOARDING_JUST_FINISHED_KEY = 'rivo_onboarding_just_finished';
export const WELCOME_BACK_KEY = 'rivo_last_seen';

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
  return value === 'true';
}

export async function markOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
}

/** Grandfather authenticated users who predated the onboarding flow. */
export async function resolveOnboardingGate(hasAuthenticatedUser: boolean): Promise<boolean> {
  const complete = await isOnboardingComplete();
  if (complete) {
    return true;
  }

  if (hasAuthenticatedUser) {
    await markOnboardingComplete();
    return true;
  }

  return false;
}

export async function markOnboardingJustFinished(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_JUST_FINISHED_KEY, 'true');
}

export async function isOnboardingJustFinished(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_JUST_FINISHED_KEY);
  return value === 'true';
}

export async function clearOnboardingJustFinished(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_JUST_FINISHED_KEY);
}

export async function getLastSeenTimestamp(): Promise<number | null> {
  const value = await AsyncStorage.getItem(WELCOME_BACK_KEY);
  if (!value) {
    return null;
  }
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function updateLastSeenTimestamp(timestamp = Date.now()): Promise<void> {
  await AsyncStorage.setItem(WELCOME_BACK_KEY, timestamp.toString());
}

export function shouldShowWelcomeBack(lastSeen: number | null, now = Date.now()): boolean {
  if (lastSeen === null) {
    return false;
  }
  const hoursSinceLastSeen = (now - lastSeen) / (1000 * 60 * 60);
  return hoursSinceLastSeen > 24;
}
