import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { ListingCard } from '@/components/listings/ListingCard';
import { api } from '@/shared/context/AuthContext';
import { normalizePaginated } from '@/shared/utils/pagination';
import type { Listing } from '@/shared/types/listing';
import type { RootStackParamList } from '@/navigation/types';
import { colors, spacing, typography } from '@/theme';

export function ExploreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get('/listings', { params: { limit: '20', sort: 'bookings' } });
      const page = normalizePaginated<Listing>(res.data);
      setListings(page.items);
    } catch {
      setError('Could not load stays. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <NativeScreen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
    >
      <View style={styles.hero}>
        <Text style={styles.kicker}>Find your stay</Text>
        <Text style={styles.headline}>Discover places across Ghana</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onPress={() => navigation.navigate('ListingDetail', { id: listing.id })}
          />
        ))
      )}
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: 6,
  },
  kicker: {
    ...typography.footnote,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headline: {
    ...typography.title2,
    color: colors.text,
  },
  loader: {
    marginTop: spacing.xl,
  },
  error: {
    ...typography.body,
    color: colors.error,
    marginTop: spacing.lg,
  },
});
