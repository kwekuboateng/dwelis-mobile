import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ExploreHeader } from '@/components/explore/ExploreHeader';
import { NativeButton } from '@/components/ui/NativeButton';
import { useAuth } from '@/shared/context/AuthContext';
import { colors, radii, spacing, typography } from '@/theme';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  danger?: boolean;
};

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.menuCard}>
        {items.map((item, index) => (
          <Pressable
            key={item.label}
            onPress={
              item.onPress ??
              (() => Alert.alert(item.label, 'This section is coming soon.'))
            }
            style={[styles.menuRow, index < items.length - 1 && styles.menuRowBorder]}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={item.danger ? colors.error : colors.textSecondary}
            />
            <Text style={[styles.menuLabel, item.danger && styles.danger]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const { user, token, roles, switchRole, logout } = useAuth();

  if (!token || !user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Your profile</Text>
        <Text style={styles.subtitle}>Sign in to manage account settings.</Text>
      </View>
    );
  }

  const canHost = roles.includes('host');

  return (
    <View style={styles.root}>
      <ExploreHeader />
      <View style={styles.titleBar}>
        <Text style={styles.pageTitle}>Profile</Text>
        <Pressable hitSlop={8} onPress={() => Alert.alert('Settings', 'Settings coming soon.')}>
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userCard}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>
                {(user.fullName ?? user.email ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.fullName ?? 'Dwelis user'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Guest</Text>
              </View>
            </View>
            {user.email ? <Text style={styles.meta}>{user.email}</Text> : null}
            {user.phoneNumber ? <Text style={styles.meta}>{user.phoneNumber}</Text> : null}
          </View>
          <Pressable
            style={styles.editBtn}
            onPress={() => Alert.alert('Edit Profile', 'Profile editing is coming soon.')}
          >
            <Ionicons name="create-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.editText}>Edit Profile</Text>
          </Pressable>
        </View>

        <MenuSection
          title="ACCOUNT"
          items={[
            { icon: 'person-outline', label: 'Personal Information' },
            { icon: 'card-outline', label: 'Payment Methods' },
            { icon: 'notifications-outline', label: 'Notifications' },
            { icon: 'options-outline', label: 'Preferences' },
            { icon: 'shield-checkmark-outline', label: 'Security' },
          ]}
        />

        <MenuSection
          title="SUPPORT"
          items={[
            { icon: 'help-buoy-outline', label: 'Help Centre' },
            { icon: 'chatbubble-ellipses-outline', label: 'Contact Support' },
            { icon: 'shield-outline', label: 'Privacy Policy' },
            { icon: 'document-text-outline', label: 'Terms of Service' },
          ]}
        />

        <View style={styles.hostBanner}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.hostTitle}>Become a Host</Text>
            <Text style={styles.hostBody}>Start earning by welcoming guests to your space.</Text>
            <NativeButton
              label="Become a Host"
              onPress={() => {
                if (canHost) void switchRole('host');
                else Alert.alert('Become a Host', 'Host onboarding is coming soon.');
              }}
              style={{ alignSelf: 'flex-start', minHeight: 40, paddingHorizontal: 16 }}
            />
          </View>
          <Ionicons name="home" size={42} color={colors.primaryDark} style={{ opacity: 0.35 }} />
        </View>

        <MenuSection
          title="SESSION"
          items={[
            {
              icon: 'log-out-outline',
              label: 'Sign Out',
              danger: true,
              onPress: () => {
                Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign Out', style: 'destructive', onPress: () => void logout() },
                ]);
              },
            },
          ]}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  title: { ...typography.title2, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary },
  titleBar: {
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  pageTitle: { ...typography.title1, color: colors.text },
  scrollPad: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
  userCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.border },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  avatarLetter: { ...typography.title2, color: colors.primaryDark },
  userInfo: { gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { ...typography.headline, color: colors.text },
  roleBadge: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  meta: { ...typography.footnote, color: colors.textSecondary },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 12,
  },
  editText: { ...typography.subhead, fontWeight: '700', color: colors.primaryDark },
  section: { gap: spacing.sm },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },
  menuCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  menuRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  menuLabel: { ...typography.subhead, color: colors.text, flex: 1 },
  danger: { color: colors.error, fontWeight: '600' },
  hostBanner: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hostTitle: { ...typography.headline, color: colors.text },
  hostBody: { ...typography.footnote, color: colors.textSecondary, marginBottom: 4 },
});
