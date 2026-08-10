import React from 'react';
import {
  ActivityIndicator,
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
import { colors, radii, spacing, typography } from '@/theme';

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
        <Pressable onPress={onViewAll} hitSlop={8}>
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
            return (
              <Pressable
                key={cat.id}
                onPress={() => onSelect?.(cat)}
                style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              >
                <View style={styles.imageWrap}>
                  <Image
                    source={CATEGORY_IMAGES[imageKey] ?? CATEGORY_IMAGES.apartments}
                    style={styles.image}
                    contentFit="cover"
                  />
                  <View style={styles.iconBadge}>
                    <Ionicons name={icon} size={14} color="#fff" />
                  </View>
                </View>
                <Text style={styles.label} numberOfLines={1}>
                  {cat.title}
                </Text>
                <Text style={styles.count}>
                  {cat.listingCount} {cat.listingCount === 1 ? 'home' : 'homes'}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

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
  viewAll: {
    ...typography.footnote,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  row: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  tile: {
    width: 128,
  },
  pressed: {
    opacity: 0.9,
  },
  imageWrap: {
    position: 'relative',
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  image: {
    width: 128,
    height: 150,
    backgroundColor: colors.border,
  },
  iconBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.subhead,
    fontWeight: '700',
    color: colors.text,
  },
  count: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
