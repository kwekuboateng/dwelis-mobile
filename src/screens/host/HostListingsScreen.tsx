import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { colors, radii, spacing, typography } from '@/theme';

export function HostListingsScreen() {
  return (
    <NativeScreen>
      <View style={styles.card}>
        <Text style={styles.title}>Your listings</Text>
        <Text style={styles.body}>Native listing management will replace the web editor step-by-step.</Text>
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
