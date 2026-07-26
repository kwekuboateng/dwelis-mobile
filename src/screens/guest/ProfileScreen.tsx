import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { NativeButton } from '@/components/ui/NativeButton';
import { useAuth } from '@/shared/context/AuthContext';
import { colors, radii, spacing, typography } from '@/theme';

export function ProfileScreen() {
  const { user, token, roles, activeRole, switchRole, logout } = useAuth();

  if (!token || !user) {
    return (
      <NativeScreen scroll={false} style={styles.centered}>
        <Text style={styles.title}>Your profile</Text>
        <Text style={styles.subtitle}>Sign in to manage account settings.</Text>
      </NativeScreen>
    );
  }

  const canSwitchToHost = roles.includes('host');

  return (
    <NativeScreen>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user.fullName ?? user.email ?? 'U').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.fullName ?? 'Dwelis user'}</Text>
        <Text style={styles.email}>{user.email ?? user.phoneNumber}</Text>
      </View>

      {canSwitchToHost ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Mode</Text>
          <View style={styles.segment}>
            <Pressable
              style={[styles.segmentItem, activeRole === 'traveller' && styles.segmentActive]}
              onPress={() => void switchRole('traveller')}
            >
              <Text style={[styles.segmentText, activeRole === 'traveller' && styles.segmentTextActive]}>Guest</Text>
            </Pressable>
            <Pressable
              style={[styles.segmentItem, activeRole === 'host' && styles.segmentActive]}
              onPress={() => void switchRole('host')}
            >
              <Text style={[styles.segmentText, activeRole === 'host' && styles.segmentTextActive]}>Host</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <NativeButton
        label="Log out"
        variant="secondary"
        onPress={() => {
          Alert.alert('Log out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log out', style: 'destructive', onPress: () => void logout() },
          ]);
        }}
        style={styles.logout}
      />
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  title: { ...typography.title2, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary },
  header: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.title1, color: colors.primary },
  name: { ...typography.title3, color: colors.text },
  email: { ...typography.subhead, color: colors.textSecondary },
  section: { marginTop: spacing.lg, gap: spacing.sm },
  sectionLabel: { ...typography.footnote, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: colors.primaryMuted },
  segmentText: { ...typography.headline, color: colors.textSecondary },
  segmentTextActive: { color: colors.text },
  logout: { marginTop: spacing.xl },
});
