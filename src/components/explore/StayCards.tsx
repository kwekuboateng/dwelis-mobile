import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SaveButton } from '@/components/listings/SaveButton';
import {
  formatGhs,
  listingBadge,
  listingLocation,
  listingNightlyPrice,
} from '@/shared/utils/listingDisplay';
import type { Listing } from '@/shared/types/listing';
import { colors, radii, spacing, typography } from '@/theme';

type HandpickedCardProps = {
  listing: Listing;
  onPress: () => void;
  width?: number;
};

export function HandpickedCard({ listing, onPress, width = 260 }: HandpickedCardProps) {
  const badge = listingBadge(listing);
  const location = listingLocation(listing);
  const price = listingNightlyPrice(listing);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
    >
      <View style={[styles.imageWrap, { height: width * 0.72 }]}>
        {listing.imageUrl ? (
          <Image source={{ uri: listing.imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="home-outline" size={28} color={colors.textTertiary} />
          </View>
        )}
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <SaveButton
          listingId={listing.id}
          title={listing.title}
          source="homepage"
          style={styles.heart}
        />
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {listing.title}
        </Text>
        {location ? (
          <Text style={styles.location} numberOfLines={1}>
            {location}
          </Text>
        ) : null}
        {listing.rating != null && listing.rating > 0 ? (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={colors.primaryDark} />
            <Text style={styles.rating}>
              {listing.rating.toFixed(1)}
              {listing.reviewCount != null ? (
                <Text style={styles.reviews}> ({listing.reviewCount})</Text>
              ) : null}
            </Text>
          </View>
        ) : null}
        <Text style={styles.price}>
          <Text style={styles.priceAmount}>{formatGhs(price)}</Text>
          <Text style={styles.priceUnit}> / night</Text>
        </Text>
      </View>
    </Pressable>
  );
}

type CompactStayCardProps = {
  listing: Listing;
  onPress: () => void;
  width?: number;
};

export function CompactStayCard({ listing, onPress, width = 150 }: CompactStayCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.compactCard, { width }, pressed && styles.pressed]}
    >
      <View style={styles.compactImageWrap}>
        {listing.imageUrl ? (
          <Image
            source={{ uri: listing.imageUrl }}
            style={styles.compactImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.compactImage, styles.placeholder]}>
            <Ionicons name="home-outline" size={22} color={colors.textTertiary} />
          </View>
        )}
        <SaveButton
          listingId={listing.id}
          title={listing.title}
          source="homepage"
          size={14}
          style={styles.compactHeart}
        />
      </View>
      <Text style={styles.compactTitle} numberOfLines={2}>
        {listing.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  pressed: { opacity: 0.92 },
  imageWrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.text },
  heart: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  body: { gap: 3 },
  title: { ...typography.subhead, fontWeight: '700', color: colors.text },
  location: { ...typography.caption, color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rating: { ...typography.caption, fontWeight: '600', color: colors.text },
  reviews: { fontWeight: '400', color: colors.textSecondary },
  price: { marginTop: 2 },
  priceAmount: { ...typography.subhead, fontWeight: '700', color: colors.text },
  priceUnit: { ...typography.caption, color: colors.textSecondary },
  compactCard: { gap: spacing.sm },
  compactImageWrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  compactImage: { width: '100%', height: 120, backgroundColor: colors.border },
  compactHeart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  compactTitle: { ...typography.footnote, fontWeight: '600', color: colors.text },
});
