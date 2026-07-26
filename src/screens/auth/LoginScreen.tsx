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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NativeButton } from '@/components/ui/NativeButton';
import { useAuth } from '@/shared/context/AuthContext';
import { colors, radii, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert('Missing fields', 'Enter your email or phone and password.');
      return;
    }
    setLoading(true);
    try {
      await login(identifier.trim(), password);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      Alert.alert('Sign in failed', message ?? 'Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.brand}>Dwelis</Text>
        <Text style={styles.subtitle}>Sign in to book and manage stays</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email or phone</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <NativeButton label="Sign in" loading={loading} onPress={() => void onSubmit()} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Pressable onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.footerLink}>Sign up</Text>
          </Pressable>
        </View>
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
  content: { gap: spacing.md },
  brand: { ...typography.largeTitle, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary },
  form: { marginTop: spacing.lg, gap: spacing.sm },
  label: { ...typography.footnote, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.sm },
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
