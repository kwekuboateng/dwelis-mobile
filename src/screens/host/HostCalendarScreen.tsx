import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { colors, radii, spacing, typography } from '@/theme';

export function HostCalendarScreen() {
  return (
    <NativeScreen>
      <View style={styles.card}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.body}>Availability and reservations in a native calendar view.</Text>
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
