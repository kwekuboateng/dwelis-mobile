import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/shared/context/AuthContext';
import { colors, minTouchSize, spacing, typography } from '@/theme';

type ExploreHeaderProps = {
  onNotificationsPress?: () => void;
  onProfilePress?: () => void;
  /** Undefined keeps the unread dot (state unknown); 0 clears the badge. */
  unreadCount?: number;
};

const iconRipple = Platform.select({
  android: { color: colors.ripple, borderless: true, radius: minTouchSize / 2 },
  default: undefined,
});

export function ExploreHeader({
  onNotificationsPress,
  onProfilePress,
  unreadCount,
}: ExploreHeaderProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const hasCount = unreadCount != null && unreadCount > 0;
  const showDot = unreadCount == null;
  const bellLabel = hasCount
    ? `Notifications, ${unreadCount} unread`
    : showDot
      ? 'Notifications, unread'
      : 'Notifications';

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.logoRow}>
        <View style={styles.logoMark}>
          <Ionicons name="home" size={14} color={colors.primaryDark} />
        </View>
        <Text style={styles.logoWord} maxFontSizeMultiplier={1.4}>
          dwelis
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={bellLabel}
          android_ripple={iconRipple}
          onPress={onNotificationsPress}
          style={({ pressed }) => [styles.iconBtn, pressed && Platform.OS === 'ios' && styles.pressed]}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {hasCount ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText} maxFontSizeMultiplier={1.2}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          ) : showDot ? (
            <View style={styles.dot} />
          ) : null}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Your profile"
          android_ripple={iconRipple}
          onPress={onProfilePress}
          style={({ pressed }) => [
            styles.avatarBtn,
            pressed && Platform.OS === 'ios' && styles.pressed,
          ]}
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter} maxFontSizeMultiplier={1.2}>
                {(user?.fullName ?? user?.email ?? 'D').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </Pressable>
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
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWord: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: -0.4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    width: minTouchSize,
    height: minTouchSize,
    borderRadius: minTouchSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  dot: {
    position: 'absolute',
    top: (minTouchSize - 22) / 2,
    right: (minTouchSize - 22) / 2 - 1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badge: {
    position: 'absolute',
    top: (minTouchSize - 22) / 2 - 4,
    right: (minTouchSize - 22) / 2 - 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: '#fff',
  },
  avatarBtn: {
    width: minTouchSize,
    height: minTouchSize,
    borderRadius: minTouchSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  avatarLetter: {
    ...typography.subhead,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
