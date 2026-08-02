import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme';

const HERO_IMAGE = require('../../../assets/home/hero-living-room.jpg');

type ExploreHeroProps = {
  onSearchPress?: () => void;
};

export function ExploreHero({ onSearchPress }: ExploreHeroProps) {
  return (
    <View style={styles.root}>
      <View style={styles.heroFrame}>
        <Image source={HERO_IMAGE} style={styles.heroImage} contentFit="cover" />
        <LinearGradient
          colors={['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0.08)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.copy}>
          <Text style={styles.headline}>
            Stay Better. <Text style={styles.headlineAccent}>Host Smarter.</Text>
          </Text>
          <Text style={styles.subhead}>
            Discover exceptional stays across Africa or grow your hosting business with one powerful
            platform.
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search stays"
        onPress={onSearchPress}
        style={({ pressed }) => [styles.searchCard, pressed && styles.searchPressed]}
      >
        <View style={styles.searchFields}>
          <View style={styles.field}>
            <Ionicons name="location-outline" size={16} color={colors.primaryDark} />
            <View style={styles.fieldText}>
              <Text style={styles.fieldLabel}>Where</Text>
              <Text style={styles.fieldValue} numberOfLines={1}>
                Search by location
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Ionicons name="calendar-outline" size={16} color={colors.primaryDark} />
            <View style={styles.fieldText}>
              <Text style={styles.fieldLabel}>Dates</Text>
              <Text style={styles.fieldValue}>Add dates</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Ionicons name="person-outline" size={16} color={colors.primaryDark} />
            <View style={styles.fieldText}>
              <Text style={styles.fieldLabel}>Guests</Text>
              <Text style={styles.fieldValue}>Add guests</Text>
            </View>
          </View>
        </View>
        <View style={styles.searchBtn}>
          <Ionicons name="search" size={18} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  heroFrame: {
    height: 280,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  copy: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingRight: spacing.xl + 8,
    gap: spacing.sm,
  },
  headline: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headlineAccent: {
    color: colors.primaryDark,
  },
  subhead: {
    ...typography.footnote,
    lineHeight: 18,
    color: colors.textSecondary,
    maxWidth: 280,
  },
  searchCard: {
    marginTop: -28,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  searchFields: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  fieldText: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  fieldValue: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: 6,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
