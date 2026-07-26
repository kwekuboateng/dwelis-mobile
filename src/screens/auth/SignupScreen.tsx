import React, { useState } from 'react';
import {
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NativeButton } from '@/components/ui/NativeButton';
import { useAuth } from '@/shared/context/AuthContext';
import { normalizePhoneE164 } from '@/shared/utils/phone';
import { colors, radii, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type SignupMethod = 'email' | 'phone';

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export function SignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signup } = useAuth();
  const [method, setMethod] = useState<SignupMethod>('email');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const emailTrimmed = email.trim();
    const phoneTrimmed = phoneNumber.trim();

    if (method === 'email') {
      if (!emailTrimmed.includes('@')) {
        Alert.alert('Invalid email', 'Enter a valid email address.');
        return;
      }
    } else {
      const normalized = normalizePhoneE164(phoneTrimmed);
      if (!normalized) {
        Alert.alert('Invalid phone', 'Enter a valid phone number.');
        return;
      }
    }

    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const result = await signup({
        email: method === 'email' ? emailTrimmed : undefined,
        phoneNumber: method === 'phone' ? normalizePhoneE164(phoneTrimmed) ?? undefined : undefined,
        password,
        fullName: fullName.trim() || undefined,
      });

      if ('needsVerification' in result && result.needsVerification) {
        navigation.replace('VerifyEmail', { email: result.email });
        return;
      }
      if ('needsPhoneVerification' in result && result.needsPhoneVerification) {
        navigation.replace('VerifyPhone', {
          phoneNumber: result.phoneNumber,
          codeAlreadySent: true,
        });
      }
      // Tokens issued: RootNavigator remounts into the app.
    } catch (err: unknown) {
      Alert.alert('Sign up failed', apiErrorMessage(err, 'Something went wrong. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brand}>Dwelis</Text>
        <Text style={styles.subtitle}>Create an account to book and host stays</Text>

        <View style={styles.methodRow}>
          {(['email', 'phone'] as SignupMethod[]).map((m) => {
            const active = method === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMethod(m)}
                style={[styles.methodTab, active && styles.methodTabActive]}
              >
                <Text style={[styles.methodTabText, active && styles.methodTabTextActive]}>
                  {m === 'email' ? 'Email' : 'Phone'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full name (optional)</Text>
          <TextInput
            autoCapitalize="words"
            placeholder="Your name"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />

          {method === 'email' ? (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={colors.textTertiary}
                style={styles.input}
                value={email}
                onChangeText={setEmail}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Phone number</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="phone-pad"
                placeholder="024 123 4567"
                placeholderTextColor={colors.textTertiary}
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </>
          )}

          <Text style={styles.label}>Password</Text>
          <TextInput
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <NativeButton label="Sign up" loading={loading} onPress={() => void onSubmit()} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  brand: { ...typography.largeTitle, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  methodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  methodTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  methodTabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  methodTabText: { ...typography.subhead, fontWeight: '600', color: colors.textSecondary },
  methodTabTextActive: { color: colors.primaryDark },
  form: { marginTop: spacing.md, gap: spacing.sm },
  label: {
    ...typography.footnote,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerText: { ...typography.subhead, color: colors.textSecondary },
  footerLink: { ...typography.subhead, fontWeight: '700', color: colors.primaryDark },
});
