import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/shared/context/AuthContext';
import { colors, spacing, typography } from '@/theme';

type HostHeaderProps = {
  title?: string;
  showLogo?: boolean;
  onSearchPress?: () => void;
  rightSlot?: React.ReactNode;
};

export function HostHeader({ title, showLogo, onSearchPress, rightSlot }: HostHeaderProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      {showLogo ? (
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Ionicons name="home" size={14} color={colors.primaryDark} />
          </View>
          <Text style={styles.logoWord}>dwelis</Text>
        </View>
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}

      {title && showLogo ? <Text style={styles.centerTitle}>{title}</Text> : null}

      <View style={styles.actions}>
        {rightSlot}
        {onSearchPress ? (
          <Pressable onPress={onSearchPress} hitSlop={8} style={styles.iconBtn}>
            <Ionicons name="search-outline" size={22} color={colors.text} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => Alert.alert('Notifications', 'Host notifications coming soon.')}
          hitSlop={8}
          style={styles.iconBtn}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          <View style={styles.dot} />
        </Pressable>
        <View style={styles.avatarBtn}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>
                {(user?.fullName ?? user?.email ?? 'H').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWord: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: -0.4,
  },
  title: { ...typography.title2, color: colors.text, flex: 1 },
  centerTitle: {
    ...typography.headline,
    color: colors.text,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    top: undefined,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.notification,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  avatarBtn: { marginLeft: 2 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.border },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  avatarLetter: { ...typography.footnote, fontWeight: '700', color: colors.primaryDark },
});
