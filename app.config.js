export default ({ config }) => ({
  ...config,
  name: 'rivo',
  slug: 'rivo',
  scheme: 'rivo',
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
});
