import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authColors } from '../../constants/authTheme';
import { useAuth } from '../../contexts/AuthContext';

function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return 'Email is required.';
  }
  if (!email.includes('@')) {
    return 'Enter a valid email address.';
  }
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null;
}

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignUp = async () => {
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    const nextConfirmError =
      password !== confirmPassword ? 'Passwords do not match.' : null;

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    setFormError(null);
    setSuccess(null);

    if (nextEmailError || nextPasswordError || nextConfirmError) {
      return;
    }

    setSubmitting(true);
    const result = await signUp(email.trim(), password);
    setSubmitting(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    setSuccess('Account created. Check your email to confirm, then sign in.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <Text style={styles.logo}>Rivo</Text>
          <Text style={styles.subtitle}>Build habits that stick.</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, emailError && styles.inputError]}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setEmailError(null);
              }}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={authColors.textSecondary}
            />
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, passwordError && styles.inputError]}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setPasswordError(null);
              }}
              secureTextEntry
              autoComplete="new-password"
              placeholder="At least 6 characters"
              placeholderTextColor={authColors.textSecondary}
            />
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={[styles.input, confirmError && styles.inputError]}
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setConfirmError(null);
              }}
              secureTextEntry
              autoComplete="new-password"
              placeholder="Repeat password"
              placeholderTextColor={authColors.textSecondary}
            />
            {confirmError ? <Text style={styles.fieldError}>{confirmError}</Text> : null}

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
            {success ? <Text style={styles.success}>{success}</Text> : null}

            <Pressable
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={() => void handleSignUp()}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={authColors.text} />
              ) : (
                <Text style={styles.primaryButtonText}>Create account</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable>
                <Text style={styles.footerLink}> Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: authColors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 24,
  },
  back: {
    marginBottom: 16,
  },
  backText: {
    color: authColors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  logo: {
    fontSize: 40,
    fontWeight: '800',
    color: authColors.accent,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: authColors.textSecondary,
    marginBottom: 32,
  },
  form: {
    backgroundColor: authColors.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: authColors.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: authColors.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: authColors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: authColors.text,
    backgroundColor: authColors.input,
  },
  inputError: {
    borderColor: authColors.error,
  },
  fieldError: {
    color: authColors.error,
    fontSize: 13,
    marginTop: 4,
  },
  formError: {
    color: authColors.error,
    marginTop: 16,
    fontSize: 14,
  },
  success: {
    color: authColors.success,
    marginTop: 16,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: authColors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: authColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: authColors.textSecondary,
  },
  footerLink: {
    color: authColors.accent,
    fontWeight: '600',
  },
});
