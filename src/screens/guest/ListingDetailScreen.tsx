import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { RouteProp, useRoute } from '@react-navigation/native';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { NativeButton } from '@/components/ui/NativeButton';
import { api } from '@/shared/context/AuthContext';
import type { Listing } from '@/shared/types/listing';
import type { RootStackParamList } from '@/navigation/types';
import { formatPriceAmount, getEffectiveNightlyPrice, hasListingDiscount } from '@/shared/utils/listingPricing';
import { colors, radii, spacing, typography } from '@/theme';

export function ListingDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ListingDetail'>>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<Listing>(`/listings/${route.params.id}`);
        if (!cancelled) setListing(res.data);
      } catch {
        if (!cancelled) setListing(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [route.params.id]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <NativeScreen scroll={false} style={styles.loader}>
        <Text style={styles.error}>Listing not found.</Text>
      </NativeScreen>
    );
  }

  const discounted = hasListingDiscount(listing.discountPercent);
  const price = formatPriceAmount(
    discounted ? getEffectiveNightlyPrice(listing.pricePerNight, listing.discountPercent) : listing.pricePerNight,
  );

  return (
    <NativeScreen edges={['bottom']}>
      {listing.imageUrl ? (
        <Image source={{ uri: listing.imageUrl }} style={styles.heroImage} contentFit="cover" />
      ) : (
        <View style={[styles.heroImage, styles.heroPlaceholder]} />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.location}>
          {[listing.city, listing.address].filter(Boolean).join(' · ') || listing.location}
        </Text>
        <Text style={styles.price}>
          GHS {price}
          <Text style={styles.perNight}> / night</Text>
        </Text>
        {listing.description ? <Text style={styles.description}>{listing.description}</Text> : null}
        <NativeButton label="Book this stay" onPress={() => {}} style={styles.cta} />
        <Text style={styles.hint}>Booking flow will connect to the same API as dwelis-frontend.</Text>
      </View>
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  error: { ...typography.body, color: colors.error },
  heroImage: { width: '100%', height: 280, borderRadius: radii.lg, marginBottom: spacing.md },
  heroPlaceholder: { backgroundColor: colors.border },
  content: { gap: spacing.sm, paddingBottom: spacing.xl },
  title: { ...typography.title2, color: colors.text },
  location: { ...typography.subhead, color: colors.textSecondary },
  price: { ...typography.title3, color: colors.text, marginTop: spacing.sm },
  perNight: { ...typography.subhead, color: colors.textSecondary },
  description: { ...typography.body, color: colors.text, marginTop: spacing.md, lineHeight: 24 },
  cta: { marginTop: spacing.lg },
  hint: { ...typography.footnote, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm },
});
