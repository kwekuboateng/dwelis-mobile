import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { colors, radii, spacing, typography } from '@/theme';

export function HostTodayScreen() {
  return (
    <NativeScreen>
      <View style={styles.card}>
        <Text style={styles.title}>Today at a glance</Text>
        <Text style={styles.body}>
          Check-ins, check-outs, and tasks will use native list layouts instead of the web host dashboard.
        </Text>
      </View>
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { ...typography.title3, color: colors.text },
  body: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
});
