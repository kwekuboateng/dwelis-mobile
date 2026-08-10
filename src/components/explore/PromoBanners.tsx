import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme';

type PromoBannersProps = {
  onHostPress?: () => void;
  onAfricaPress?: () => void;
};

export function PromoBanners({ onHostPress, onAfricaPress }: PromoBannersProps) {
  return (
    <View style={styles.root}>
      <Pressable
        onPress={onHostPress}
        style={({ pressed }) => [styles.card, styles.hostCard, pressed && styles.pressed]}
      >
        <View style={styles.hostIcon}>
          <Ionicons name="grid-outline" size={22} color={colors.primaryDark} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>The Host Operating System</Text>
          <Text style={styles.body}>
            Automate bookings, messaging, and payouts from one dashboard.
          </Text>
          <Text style={styles.link}>Learn more →</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
      </Pressable>

      <Pressable
        onPress={onAfricaPress}
        style={({ pressed }) => [styles.card, styles.africaCard, pressed && styles.pressed]}
      >
        <View style={styles.africaIcon}>
          <Ionicons name="globe-outline" size={22} color="#B45309" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Explore Africa differently</Text>
          <Text style={styles.body}>
            From city escapes to beachfront retreats across the continent.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#B45309" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.md,
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
  hostIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  africaIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
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
