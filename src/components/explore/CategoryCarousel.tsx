import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { HomepageCategory } from '@/shared/types/listing';
import { colors, minTouchSize, radii, spacing, typography } from '@/theme';

const CATEGORY_IMAGES: Record<string, ImageSourcePropType> = {
  apartments: require('../../../assets/home/categories/entire-homes.jpg'),
  'guest-houses': require('../../../assets/home/categories/city-stays.jpg'),
  'private-suites': require('../../../assets/home/categories/romantic-getaways.jpg'),
  'private-rooms': require('../../../assets/home/categories/business-travel.jpg'),
  'instant-book': require('../../../assets/home/categories/long-stays.jpg'),
  'business-travel': require('../../../assets/home/categories/business-travel.jpg'),
  'family-friendly': require('../../../assets/home/categories/family-friendly.jpg'),
  'long-stays': require('../../../assets/home/categories/long-stays.jpg'),
  'new-on-dwelis': require('../../../assets/home/categories/beachfront.jpg'),
  featured: require('../../../assets/home/categories/entire-homes.jpg'),
  'guest-favorites': require('../../../assets/home/categories/family-friendly.jpg'),
  beachfront: require('../../../assets/home/categories/beachfront.jpg'),
  'city-stays': require('../../../assets/home/categories/city-stays.jpg'),
  'entire-homes': require('../../../assets/home/categories/entire-homes.jpg'),
};

const CATEGORY_ICONS: Record<string, ComponentProps<typeof Ionicons>['name']> = {
  apartments: 'home-outline',
  'guest-houses': 'business-outline',
  'private-suites': 'heart-outline',
  'private-rooms': 'bed-outline',
  'instant-book': 'flash-outline',
  'business-travel': 'briefcase-outline',
  'family-friendly': 'people-outline',
  'long-stays': 'calendar-outline',
  'new-on-dwelis': 'sparkles-outline',
  featured: 'star-outline',
  'guest-favorites': 'heart',
  beachfront: 'water-outline',
  'city-stays': 'business-outline',
  'entire-homes': 'home-outline',
};

type CategoryCarouselProps = {
  categories: HomepageCategory[];
  loading?: boolean;
  onSelect?: (category: HomepageCategory) => void;
  onViewAll?: () => void;
};

export function CategoryCarousel({
  categories,
  loading,
  onSelect,
  onViewAll,
}: CategoryCarouselProps) {
  if (!loading && categories.length === 0) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore stays by category</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all categories"
          android_ripple={viewAllRipple}
          onPress={onViewAll}
          style={styles.viewAllBtn}
        >
          <Text style={styles.viewAll}>View all</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {categories.map((cat) => {
            const imageKey = cat.image || cat.slug;
            const icon = CATEGORY_ICONS[imageKey] ?? CATEGORY_ICONS[cat.slug] ?? 'home-outline';
            const countLabel = `${cat.listingCount} ${cat.listingCount === 1 ? 'home' : 'homes'}`;
            return (
              <Pressable
                key={cat.id}
                accessibilityRole="button"
                accessibilityLabel={`${cat.title}, ${countLabel}`}
                android_ripple={tileRipple}
                onPress={() => onSelect?.(cat)}
                style={({ pressed }) => [
                  styles.tile,
                  pressed && Platform.OS === 'ios' && styles.pressed,
                ]}
              >
                <View style={styles.imageWrap}>
                  <Image
                    source={CATEGORY_IMAGES[imageKey] ?? CATEGORY_IMAGES.apartments}
                    style={styles.image}
                    contentFit="cover"
                  />
                  <View style={styles.iconBadge}>
                    <Ionicons name={icon} size={16} color={colors.primaryDark} />
                  </View>
                </View>
                <View style={styles.tileBody}>
                  <Text style={styles.label} numberOfLines={1} maxFontSizeMultiplier={1.5}>
                    {cat.title}
                  </Text>
                  <Text style={styles.count} numberOfLines={1} maxFontSizeMultiplier={1.5}>
                    {countLabel}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const tileRipple = Platform.select({
  android: { color: colors.ripple, foreground: true },
  default: undefined,
});

const viewAllRipple = Platform.select({
  android: { color: colors.ripple },
  default: undefined,
});

const styles = StyleSheet.create({
  root: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.headline,
    color: colors.text,
    flex: 1,
    paddingRight: spacing.sm,
  },
  viewAllBtn: {
    minHeight: minTouchSize,
    justifyContent: 'center',
    paddingLeft: spacing.sm,
    borderRadius: radii.sm,
  },
  viewAll: {
    ...typography.footnote,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    gap: spacing.md,
  },
  tile: {
    width: 132,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pressed: {
    opacity: 0.9,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 110,
    backgroundColor: colors.border,
  },
  iconBadge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: 0,
    width: 32,
    height: 32,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBody: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 2,
  },
  label: {
    ...typography.subhead,
    fontWeight: '700',
    color: colors.text,
  },
  count: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
