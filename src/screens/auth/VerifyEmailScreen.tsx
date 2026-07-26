import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NativeButton } from '@/components/ui/NativeButton';
import { useAuth } from '@/shared/context/AuthContext';
import { colors, radii, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

function maskEmail(email: string): string {
  if (!email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0] ?? ''}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export function VerifyEmailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'VerifyEmail'>>();
  const { verifyEmailWithCode, resendVerificationEmail } = useAuth();
  const email = route.params?.email ?? '';
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const onVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Invalid code', 'Enter the 6-digit code from your email.');
      return;
    }
    setVerifying(true);
    try {
      await verifyEmailWithCode(email, code);
      // Auth token set → RootNavigator remounts into the app.
    } catch (err: unknown) {
      Alert.alert('Verification failed', apiErrorMessage(err, 'Invalid or expired code.'));
    } finally {
      setVerifying(false);
    }
  };

  const onResend = async () => {
    setResending(true);
    try {
      const res = await resendVerificationEmail(email);
      if (res.alreadyVerified) {
        Alert.alert('Already verified', 'Your email is already verified. Try signing in.');
        navigation.replace('Login');
        return;
      }
      if (res.sent) {
        Alert.alert('Code sent', 'Check your email for a new code.');
      } else {
        Alert.alert('Could not resend', 'Try again in a moment.');
      }
    } catch (err: unknown) {
      Alert.alert('Could not resend', apiErrorMessage(err, 'Try again in a moment.'));
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <View style={styles.root}>
        <Text style={styles.subtitle}>No email to verify. Sign up first.</Text>
        <NativeButton label="Go to sign up" onPress={() => navigation.replace('Signup')} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to {maskEmail(email)}. Enter it below.
        </Text>

        <Text style={styles.label}>Verification code</Text>
        <TextInput
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, styles.codeInput]}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
        />

        <NativeButton
          label="Verify"
          loading={verifying}
          disabled={code.length !== 6}
          onPress={() => void onVerify()}
        />

        <Pressable onPress={() => void onResend()} disabled={resending} style={styles.resend}>
          <Text style={styles.resendText}>
            {resending ? 'Sending…' : "Didn't receive it? Resend code"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: { gap: spacing.sm },
  title: { ...typography.title2, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
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
  codeInput: {
    letterSpacing: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
  },
  resend: { alignItems: 'center', marginTop: spacing.md, padding: spacing.sm },
  resendText: { ...typography.subhead, fontWeight: '600', color: colors.primaryDark },
});
