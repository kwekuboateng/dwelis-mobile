import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme';
import {
  formatPriceAmount,
  getEffectiveNightlyPrice,
  hasListingDiscount,
} from '@/shared/utils/listingPricing';
import type { Listing } from '@/shared/types/listing';

type ListingCardProps = {
  listing: Listing;
  onPress: () => void;
};

export function ListingCard({ listing, onPress }: ListingCardProps) {
  const discounted = hasListingDiscount(listing.discountPercent);
  const displayPrice = formatPriceAmount(
    discounted
      ? getEffectiveNightlyPrice(listing.pricePerNight, listing.discountPercent)
      : listing.pricePerNight,
  );
  const subtitle = [listing.city, listing.address].filter(Boolean).join(' · ') || listing.location || '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        {listing.imageUrl ? (
          <Image source={{ uri: listing.imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="home-outline" size={28} color={colors.textTertiary} />
          </View>
        )}
        {listing.rating != null && listing.rating > 0 ? (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{listing.rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        <View style={styles.priceRow}>
          <Text style={styles.price}>GHS {displayPrice}</Text>
          <Text style={styles.perNight}>/ night</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: colors.border,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  ratingText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    padding: spacing.md,
    gap: 6,
  },
  title: {
    ...typography.headline,
    color: colors.text,
  },
  subtitle: {
    ...typography.subhead,
    color: colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  price: {
    ...typography.headline,
    color: colors.text,
  },
  perNight: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
});
