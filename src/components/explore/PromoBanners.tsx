import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme';

type PromoBannersProps = {
  onHostPress?: () => void;
  onAfricaPress?: () => void;
};

const cardRipple = Platform.select({
  android: { color: colors.ripple, foreground: true },
  default: undefined,
});

export function PromoBanners({ onHostPress, onAfricaPress }: PromoBannersProps) {
  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="The Host Operating System. Learn more about hosting on Dwelis"
        android_ripple={cardRipple}
        onPress={onHostPress}
        style={({ pressed }) => [
          styles.card,
          styles.hostCard,
          pressed && Platform.OS === 'ios' && styles.pressed,
        ]}
      >
        <View style={styles.hostThumb}>
          <View style={styles.hostThumbBar}>
            <Ionicons name="grid" size={10} color="#fff" />
            <View style={styles.hostThumbBarLine} />
          </View>
          <View style={styles.hostThumbBody}>
            <View style={styles.hostThumbRow} />
            <View style={styles.hostThumbRow} />
            <View style={[styles.hostThumbRow, styles.hostThumbRowShort]} />
          </View>
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} maxFontSizeMultiplier={1.5}>
            The Host Operating System
          </Text>
          <Text style={styles.body} maxFontSizeMultiplier={1.5}>
            Dwelis helps you automate operations, delight guests, and grow your portfolio — all in
            one powerful platform.
          </Text>
          <Text style={styles.link} maxFontSizeMultiplier={1.5}>
            Learn more →
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Explore Africa differently"
        android_ripple={cardRipple}
        onPress={onAfricaPress}
        style={({ pressed }) => [
          styles.card,
          styles.africaCard,
          pressed && Platform.OS === 'ios' && styles.pressed,
        ]}
      >
        <View style={styles.africaThumb}>
          <Ionicons name="earth-outline" size={40} color={colors.africaInk} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} maxFontSizeMultiplier={1.5}>
            Explore Africa differently
          </Text>
          <Text style={styles.body} maxFontSizeMultiplier={1.5}>
            From vibrant cities to serene escapes, Dwelis connects you to exceptional stays across
            the continent.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.africaInk} />
      </Pressable>
    </View>
  );
}

const THUMB = 72;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.md,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.92,
  },
  hostCard: {
    backgroundColor: colors.primarySoft,
  },
  africaCard: {
    backgroundColor: colors.africaSoft,
  },
  // Miniature of the host dashboard shown in the design.
  hostThumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryMuted,
    overflow: 'hidden',
  },
  hostThumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  hostThumbBarLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  hostThumbBody: {
    flex: 1,
    padding: 6,
    gap: 5,
  },
  hostThumbRow: {
    height: 8,
    borderRadius: 2,
    backgroundColor: colors.primaryMuted,
  },
  hostThumbRowShort: {
    width: '60%',
  },
  africaThumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.subhead,
    fontWeight: '700',
    color: colors.text,
  },
  body: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  link: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 2,
  },
});
