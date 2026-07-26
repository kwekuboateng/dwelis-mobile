import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { NativeButton } from '@/components/ui/NativeButton';
import { useAuth } from '@/shared/context/AuthContext';
import { colors, radii, spacing, typography } from '@/theme';

export function HostMoreScreen() {
  const { switchRole, logout } = useAuth();

  return (
    <NativeScreen>
      <View style={styles.card}>
        <Text style={styles.title}>Host tools</Text>
        <Text style={styles.body}>Payouts, cleaning, and analytics will live here with native navigation patterns.</Text>
      </View>

      <NativeButton
        label="Switch to guest mode"
        variant="secondary"
        onPress={() => void switchRole('traveller')}
        style={styles.button}
      />
      <NativeButton
        label="Log out"
        variant="ghost"
        onPress={() => {
          Alert.alert('Log out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log out', style: 'destructive', onPress: () => void logout() },
          ]);
        }}
      />
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: { ...typography.title3, color: colors.text },
  body: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
  button: { marginBottom: spacing.sm },
});
