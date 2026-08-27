import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { SearchField } from '@/components/explore/SearchSheet';
import { colors, minTouchSize, radii, spacing, typography } from '@/theme';

const HERO_IMAGE = require('../../../assets/home/hero-living-room.jpg');

type ExploreHeroProps = {
  where?: string | null;
  dates?: string | null;
  guests?: string | null;
  onFieldPress?: (field: SearchField) => void;
  onSearchPress?: () => void;
};

const fieldRipple = Platform.select({
  android: { color: colors.ripple },
  default: undefined,
});

export function ExploreHero({
  where,
  dates,
  guests,
  onFieldPress,
  onSearchPress,
}: ExploreHeroProps) {
  const { fontScale } = useWindowDimensions();
  // At large system font sizes the three fields plus a labelled button stop fitting on one row.
  const stacked = fontScale > 1.15;
  const showSearchLabel = Platform.OS === 'android' && !stacked;

  return (
    <View style={styles.root}>
      <View style={styles.heroFrame}>
        <Image
          source={HERO_IMAGE}
          style={styles.heroImage}
          contentFit="cover"
          accessible
          accessibilityLabel="Poolside villa at sunset"
        />
        {/* Fades the image out from the left so the copy stays legible at any width. */}
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.97)',
            'rgba(255,255,255,0.9)',
            'rgba(255,255,255,0.5)',
            'rgba(255,255,255,0)',
          ]}
          locations={[0, 0.34, 0.6, 0.9]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.35 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.copy}>
          <Text style={styles.headline} maxFontSizeMultiplier={1.6}>
            Stay Better.{'\n'}
            <Text style={styles.headlineAccent}>Host Smarter.</Text>
          </Text>
          <Text style={styles.subhead} maxFontSizeMultiplier={1.6}>
            Discover exceptional stays across Africa or grow your hosting business with one powerful
            platform.
          </Text>
        </View>
      </View>

      <View style={[styles.searchCard, stacked && styles.searchCardStacked]}>
        <View style={[styles.searchFields, stacked && styles.searchFieldsStacked]}>
          <SearchCardField
            icon="location-outline"
            label="Where"
            value={where || 'Search by location'}
            filled={!!where}
            onPress={() => onFieldPress?.('where')}
          />
          <View style={[styles.divider, stacked && styles.dividerStacked]} />
          <SearchCardField
            icon="calendar-outline"
            label="Dates"
            value={dates || 'Add dates'}
            filled={!!dates}
            onPress={() => onFieldPress?.('dates')}
          />
          <View style={[styles.divider, stacked && styles.dividerStacked]} />
          <SearchCardField
            icon="person-outline"
            label="Guests"
            value={guests || 'Add guests'}
            filled={!!guests}
            onPress={() => onFieldPress?.('guests')}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search stays"
          android_ripple={Platform.select({
            android: { color: colors.rippleLight },
            default: undefined,
          })}
          onPress={onSearchPress}
          style={({ pressed }) => [
            styles.searchBtn,
            showSearchLabel && styles.searchBtnLabelled,
            stacked && styles.searchBtnStacked,
            pressed && Platform.OS === 'ios' && styles.searchBtnPressed,
          ]}
        >
          <Ionicons name="search" size={18} color="#fff" />
          {showSearchLabel || stacked ? (
            <Text style={styles.searchBtnText} maxFontSizeMultiplier={1.3}>
              Search
            </Text>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

type SearchCardFieldProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  filled: boolean;
  onPress: () => void;
};

function SearchCardField({ icon, label, value, filled, onPress }: SearchCardFieldProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      android_ripple={fieldRipple}
      onPress={onPress}
      style={({ pressed }) => [styles.field, pressed && Platform.OS === 'ios' && styles.fieldPressed]}
    >
      <Ionicons name={icon} size={16} color={colors.primaryDark} />
      <View style={styles.fieldText}>
        <Text style={styles.fieldLabel} numberOfLines={1} maxFontSizeMultiplier={1.4}>
          {label}
        </Text>
        <Text
          style={[styles.fieldValue, filled && styles.fieldValueFilled]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.4}
        >
          {value}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: spacing.lg,
  },
  heroFrame: {
    minHeight: 250,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  copy: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    // Keeps the copy clear of the search card that overlaps the bottom edge.
    paddingBottom: 56,
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
    marginTop: -32,
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchCardStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchFields: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchFieldsStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    minHeight: minTouchSize,
    paddingHorizontal: 6,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  fieldPressed: {
    opacity: 0.7,
  },
  fieldText: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  fieldValue: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  fieldValueFilled: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: colors.border,
  },
  dividerStacked: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
  },
  searchBtn: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  searchBtnLabelled: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  searchBtnStacked: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: minTouchSize,
  },
  searchBtnPressed: {
    opacity: 0.9,
  },
  searchBtnText: {
    ...typography.subhead,
    fontWeight: '700',
    color: '#fff',
  },
});
