import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { useAuth } from '@/shared/context/AuthContext';
import { colors, spacing, typography } from '@/theme';

export function MessagesScreen() {
  const { token } = useAuth();

  return (
    <NativeScreen scroll={false} style={styles.centered}>
      <View style={styles.content}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.body}>
          {token
            ? 'Native messaging UI will replace the web chat layout here.'
            : 'Sign in to message hosts and guests.'}
        </Text>
      </View>
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  title: { ...typography.title2, color: colors.text },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
