import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../constants/theme';

export default function ConfigRequiredScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Supabase setup required</Text>
        <Text style={styles.body}>
          Rivo needs your Supabase project credentials before auth can work.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Create a Supabase project</Text>
          <Text style={styles.cardBody}>
            Go to supabase.com, create a project, and copy your project URL and anon key from
            Settings → API.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Add environment variables</Text>
          <Text style={styles.cardBody}>
            Copy `.env.example` to `.env` in the project root and fill in:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL=...</Text>
            <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_ANON_KEY=...</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Enable Apple Sign In (iOS)</Text>
          <Text style={styles.cardBody}>
            In Supabase Auth → Providers, enable Apple. Add the Sign in with Apple capability in
            your Apple Developer account for production builds.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>4. Restart Expo</Text>
          <Text style={styles.cardBody}>
            Stop the dev server and run `npx expo start` again so env vars are picked up.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  codeBlock: {
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.sm,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: colors.primary,
  },
});
