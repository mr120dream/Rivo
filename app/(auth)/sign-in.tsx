import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export default function SignInScreen() {
  const { signIn, signInWithApple, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleSignIn = async () => {
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError(null);

    if (nextEmailError || nextPasswordError) {
      return;
    }

    setSubmitting(true);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    router.replace('/');
  };

  const handleForgotPassword = async () => {
    const nextEmailError = validateEmail(email);
    setEmailError(nextEmailError);
    if (nextEmailError) {
      return;
    }

    const result = await resetPassword(email.trim());
    if (result.error) {
      Alert.alert('Could not send reset email', result.error);
      return;
    }
    Alert.alert('Check your email', 'We sent a password reset link to your inbox.');
  };

  const handleAppleSignIn = async () => {
    setFormError(null);
    setAppleLoading(true);
    const result = await signInWithApple();
    setAppleLoading(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
              autoComplete="password"
              placeholder="Your password"
              placeholderTextColor={authColors.textSecondary}
            />
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

            <Pressable onPress={() => void handleForgotPassword()} style={styles.forgotLink}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <Pressable
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={() => void handleSignIn()}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={authColors.text} />
              ) : (
                <Text style={styles.primaryButtonText}>Sign in</Text>
              )}
            </Pressable>

            {Platform.OS === 'ios' ? (
              <View style={styles.appleWrap}>
                {appleLoading ? (
                  <ActivityIndicator color={authColors.text} />
                ) : (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={12}
                    style={styles.appleButton}
                    onPress={handleAppleSignIn}
                  />
                )}
              </View>
            ) : (
              <Pressable style={styles.appleFallback} disabled>
                <Ionicons name="logo-apple" size={18} color={authColors.text} />
                <Text style={styles.appleFallbackText}>Sign in with Apple</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Rivo?</Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable>
                <Text style={styles.footerLink}> Create account</Text>
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
    justifyContent: 'center',
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
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    color: authColors.textSecondary,
    fontSize: 13,
  },
  formError: {
    color: authColors.error,
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
  appleWrap: {
    marginTop: 16,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  appleButton: {
    width: '100%',
    height: 48,
  },
  appleFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 14,
  },
  appleFallbackText: {
    color: authColors.text,
    fontSize: 15,
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
