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

type CommonProps = {
  listing: Listing;
  onPress: () => void;
};

/** Horizontal card used on Handpicked / Browse City results (mo3/mo4). */
export function HorizontalResultCard({ listing, onPress }: CommonProps) {
  const badge = listingBadge(listing);
  const location = listingLocation(listing);
  const price = listingNightlyPrice(listing);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.hCard, pressed && styles.pressed]}
    >
      <View style={styles.hImageWrap}>
        {listing.imageUrl ? (
          <Image source={{ uri: listing.imageUrl }} style={styles.hImage} contentFit="cover" />
        ) : (
          <View style={[styles.hImage, styles.placeholder]}>
            <Ionicons name="home-outline" size={24} color={colors.textTertiary} />
          </View>
        )}
        {badge ? (
          <View style={styles.badge}>
            <Ionicons name="star" size={10} color={colors.primaryDark} />
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <SaveButton
          listingId={listing.id}
          title={listing.title}
          source="search_results"
          style={styles.hSave}
        />
      </View>
      <View style={styles.hBody}>
        <Text style={styles.hTitle} numberOfLines={2}>
          {listing.title}
        </Text>
        {location ? (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.meta} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}
        {listing.rating != null && listing.rating > 0 ? (
          <View style={styles.metaRow}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.meta}>
              {listing.rating.toFixed(1)}
              {listing.reviewCount != null ? ` (${listing.reviewCount} reviews)` : ''}
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

/** Large vertical search result card (mo5). */
export function VerticalResultCard({ listing, onPress }: CommonProps) {
  const badge = listingBadge(listing);
  const location = listingLocation(listing);
  const price = listingNightlyPrice(listing);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.vCard, pressed && styles.pressed]}
    >
      <View style={styles.vImageWrap}>
        {listing.imageUrl ? (
          <Image source={{ uri: listing.imageUrl }} style={styles.vImage} contentFit="cover" />
        ) : (
          <View style={[styles.vImage, styles.placeholder]}>
            <Ionicons name="home-outline" size={28} color={colors.textTertiary} />
          </View>
        )}
        {badge ? (
          <View style={styles.badge}>
            <Ionicons name="star" size={10} color={colors.primaryDark} />
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <SaveButton
          listingId={listing.id}
          title={listing.title}
          source="search_results"
          style={styles.vSave}
        />
      </View>
      <View style={styles.vBody}>
        <Text style={styles.vTitle} numberOfLines={2}>
          {listing.title}
        </Text>
        {location ? (
          <Text style={styles.meta} numberOfLines={1}>
            {location}
          </Text>
        ) : null}
        {listing.rating != null && listing.rating > 0 ? (
          <View style={styles.metaRow}>
            <Ionicons name="star" size={12} color={colors.primaryDark} />
            <Text style={styles.meta}>
              {listing.rating.toFixed(1)}
              {listing.reviewCount != null ? ` (${listing.reviewCount} reviews)` : ''}
            </Text>
          </View>
        ) : null}
        <View style={styles.specs}>
          {listing.propertyType ? (
            <View style={styles.spec}>
              <Ionicons name="home-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.specText}>{listing.propertyType}</Text>
            </View>
          ) : null}
          {listing.guestsCount != null ? (
            <View style={styles.spec}>
              <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.specText}>{listing.guestsCount} guests</Text>
            </View>
          ) : null}
          {listing.bedroomCount != null ? (
            <View style={styles.spec}>
              <Ionicons name="bed-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.specText}>{listing.bedroomCount} bedrooms</Text>
            </View>
          ) : null}
          {listing.bathroomCount != null ? (
            <View style={styles.spec}>
              <Ionicons name="water-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.specText}>{listing.bathroomCount} bathrooms</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.price, styles.vPrice]}>
          <Text style={styles.priceAmount}>{formatGhs(price)}</Text>
          <Text style={styles.priceUnit}> / night</Text>
        </Text>
      </View>
    </Pressable>
  );
}

/** 2-column saved grid card (mo7). */
export function SavedGridCard({ listing, onPress }: CommonProps) {
  const badge = listingBadge(listing);
  const location = listingLocation(listing);
  const price = listingNightlyPrice(listing);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.gCard, pressed && styles.pressed]}
    >
      <View style={styles.gImageWrap}>
        {listing.imageUrl ? (
          <Image source={{ uri: listing.imageUrl }} style={styles.gImage} contentFit="cover" />
        ) : (
          <View style={[styles.gImage, styles.placeholder]}>
            <Ionicons name="home-outline" size={22} color={colors.textTertiary} />
          </View>
        )}
        {badge ? (
          <View style={[styles.badge, styles.gBadge]}>
            <Ionicons name="star" size={9} color={colors.primaryDark} />
            <Text style={[styles.badgeText, { fontSize: 10 }]}>{badge}</Text>
          </View>
        ) : null}
        <SaveButton
          listingId={listing.id}
          title={listing.title}
          source="saved_stays"
          size={16}
          style={styles.gSave}
        />
      </View>
      <Text style={styles.gTitle} numberOfLines={1}>
        {listing.title}
      </Text>
      {location ? (
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
          <Text style={styles.gMeta} numberOfLines={1}>
            {location}
          </Text>
        </View>
      ) : null}
      {listing.rating != null && listing.rating > 0 ? (
        <View style={styles.metaRow}>
          <Ionicons name="star" size={11} color={colors.primaryDark} />
          <Text style={styles.gMeta}>
            {listing.rating.toFixed(1)}
            {listing.reviewCount != null ? ` (${listing.reviewCount})` : ''}
          </Text>
        </View>
      ) : null}
      <Text style={styles.gPrice}>
        <Text style={styles.priceAmount}>{formatGhs(price)}</Text>
        <Text style={styles.priceUnit}> / night</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.92 },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  price: { marginTop: 4 },
  priceAmount: {
    ...typography.subhead,
    fontWeight: '700',
    color: colors.text,
  },
  priceUnit: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  hCard: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  hImageWrap: {
    width: 120,
    height: 110,
    borderRadius: radii.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  hImage: { width: '100%', height: '100%' },
  hSave: { position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14 },
  hBody: { flex: 1, gap: 4, justifyContent: 'center' },
  hTitle: { ...typography.subhead, fontWeight: '700', color: colors.text },

  vCard: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  vImageWrap: {
    height: 200,
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.border,
  },
  vImage: { width: '100%', height: '100%' },
  vSave: { position: 'absolute', top: 10, right: 10 },
  vBody: { gap: 4 },
  vTitle: { ...typography.headline, color: colors.text },
  specs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 6,
  },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '46%' },
  specText: { ...typography.caption, color: colors.textSecondary },
  vPrice: { alignSelf: 'flex-end', marginTop: 8 },

  gCard: { width: '48%', gap: 4, marginBottom: spacing.md },
  gImageWrap: {
    width: '100%',
    aspectRatio: 1.05,
    borderRadius: radii.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  gImage: { width: '100%', height: '100%' },
  gBadge: { top: 6, left: 6, paddingHorizontal: 6, paddingVertical: 3 },
  gSave: { position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14 },
  gTitle: { ...typography.footnote, fontWeight: '700', color: colors.text },
  gMeta: { ...typography.caption, color: colors.textSecondary, flexShrink: 1, fontSize: 11 },
  gPrice: { marginTop: 2 },
});
