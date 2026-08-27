import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SearchChrome } from '@/components/explore/SearchChrome';
import { HorizontalResultCard, VerticalResultCard } from '@/components/listings/ResultCards';
import { api } from '@/shared/context/AuthContext';
import { normalizePaginated } from '@/shared/utils/pagination';
import type { Listing } from '@/shared/types/listing';
import type { RootStackParamList } from '@/navigation/types';
import { colors, spacing, typography } from '@/theme';

type Mode = 'handpicked' | 'browse' | 'search';

type Props = {
  mode: Mode;
};

type LoaderFilters = {
  featured?: boolean;
  /** ISO `YYYY-MM-DD` availability window picked in the home search sheet. */
  checkIn?: string;
  checkOut?: string;
  category?: string;
};

function useListingsLoader(mode: Mode, city?: string, filters: LoaderFilters = {}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { featured, checkIn, checkOut, category } = filters;

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const params: Record<string, string> = { limit: '24', sort: 'bookings' };
        if (mode === 'handpicked' || featured) params.featured = 'true';
        if (city) params.city = city;
        if (checkIn) params.check_in = checkIn;
        if (checkOut) params.check_out = checkOut;
        if (category) params.category = category;
        const res = await api.get('/listings', { params });
        const page = normalizePaginated<Listing>(res.data);
        const items =
          mode === 'handpicked' ? page.items.filter((l) => l.featured) : page.items;
        setListings(items.length > 0 ? items : page.items);
        setTotal(page.total || items.length || page.items.length);
      } catch {
        setListings([]);
        setTotal(0);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mode, city, featured, checkIn, checkOut, category],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { listings, total, loading, refreshing, load };
}

export function HandpickedCollectionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { listings, total, loading, refreshing, load } = useListingsLoader('handpicked');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <SearchChrome
        title="Search Results"
        summary={{ where: 'Accra', dates: 'Add dates', guests: 'Add guests' }}
        activeChips={['Handpicked by Dwelis', 'Guest Favourite']}
        resultCountLabel={`${total} stays in Accra`}
        onBack={() => navigation.goBack()}
        onClearChips={() => navigation.navigate('BrowseCityStays', { city: 'Accra' })}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={listings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
            }
            renderItem={({ item }) => (
              <HorizontalResultCard
                listing={item}
                onPress={() => navigation.navigate('ListingDetail', { id: item.id })}
              />
            )}
            ListEmptyComponent={<Text style={styles.empty}>No handpicked stays right now.</Text>}
          />
        )}
      </SearchChrome>
    </View>
  );
}

export function BrowseCityStaysScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'BrowseCityStays'>>();
  const insets = useSafeAreaInsets();
  const city = route.params?.city ?? 'Accra';
  const { listings, total, loading, refreshing, load } = useListingsLoader('browse', city);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <SearchChrome
        title="Search Results"
        summary={{ where: city, dates: 'Add dates', guests: 'Add guests' }}
        resultCountLabel={`${total} stays`}
        headerExtra={
          <View style={styles.browseHeader}>
            <Text style={styles.browseTitle}>Browse Stays in {city}</Text>
            <Text style={styles.browseSub}>
              Discover verified homes, apartments and villas across {city}.
            </Text>
          </View>
        }
        onBack={() => navigation.goBack()}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={listings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
            }
            renderItem={({ item }) => (
              <HorizontalResultCard
                listing={item}
                onPress={() => navigation.navigate('ListingDetail', { id: item.id })}
              />
            )}
            ListEmptyComponent={<Text style={styles.empty}>No stays found in {city}.</Text>}
          />
        )}
      </SearchChrome>
    </View>
  );
}

export function SearchResultsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'SearchResults'>>();
  const insets = useSafeAreaInsets();
  const params = route.params ?? {};
  const city = params.city ?? params.where ?? 'Accra';
  const { listings, total, loading, refreshing, load } = useListingsLoader('search', city, {
    featured: params.featured,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    category: params.category,
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <SearchChrome
        title={params.title ?? 'Search Results'}
        summary={{
          where: params.where ?? city,
          dates: params.dates,
          guests: params.guests,
        }}
        resultCountLabel={`${total} stays in ${city}`}
        sortLabel="Sort by: Recommended"
        onBack={() => navigation.goBack()}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={listings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listPad}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
            }
            renderItem={({ item }) => (
              <VerticalResultCard
                listing={item}
                onPress={() => navigation.navigate('ListingDetail', { id: item.id })}
              />
            )}
            ListEmptyComponent={<Text style={styles.empty}>No stays match your search.</Text>}
          />
        )}
      </SearchChrome>
    </View>
  );
}

// Keep unused Props type referenced for clarity in future refactors
void (null as unknown as Props);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  listPad: { paddingHorizontal: spacing.md, paddingBottom: 100, paddingTop: spacing.sm },
  loader: { marginTop: spacing.xl },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  browseHeader: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: 4,
  },
  browseTitle: { ...typography.title3, color: colors.text },
  browseSub: { ...typography.footnote, color: colors.textSecondary },
});
