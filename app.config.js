export default ({ config }) => ({
  ...config,
  name: 'rivo',
  slug: 'rivo',
  scheme: 'rivo',
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.120dreams.rivo',
    buildNumber: '1',
    supportsTablet: false,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
});
