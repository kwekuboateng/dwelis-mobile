import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExploreHeader } from '@/components/explore/ExploreHeader';
import { ExploreHero } from '@/components/explore/ExploreHero';
import { CategoryCarousel } from '@/components/explore/CategoryCarousel';
import { CompactStayCard, HandpickedCard } from '@/components/explore/StayCards';
import { PromoBanners } from '@/components/explore/PromoBanners';
import { HomeLoadingSkeleton } from '@/components/ui/Skeleton';
import { api, useAuth } from '@/shared/context/AuthContext';
import { normalizePaginated } from '@/shared/utils/pagination';
import type { HomepageCategory, Listing } from '@/shared/types/listing';
import type { GuestTabParamList, RootStackParamList } from '@/navigation/types';
import { colors, spacing, typography } from '@/theme';

type ExploreNav = CompositeNavigationProp<
  BottomTabNavigationProp<GuestTabParamList, 'Explore'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const BROWSE_CITY = 'Accra';

export function ExploreScreen() {
  const navigation = useNavigation<ExploreNav>();
  const { switchRole, roles } = useAuth();
  const [categories, setCategories] = useState<HomepageCategory[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [browse, setBrowse] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openListing = (id: string) => {
    navigation.navigate('ListingDetail', { id });
  };

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [categoriesRes, featuredRes, browseRes] = await Promise.all([
        api.get<HomepageCategory[]>('/listings/categories/homepage'),
        api.get('/listings', { params: { featured: 'true', limit: '8' } }),
        api.get('/listings', { params: { city: BROWSE_CITY, limit: '8', sort: 'bookings' } }),
      ]);

      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);

      const featuredPage = normalizePaginated<Listing>(featuredRes.data);
      const featuredItems = featuredPage.items.filter((l) => l.featured);
      setFeatured(featuredItems.length > 0 ? featuredItems : featuredPage.items);

      const browsePage = normalizePaginated<Listing>(browseRes.data);
      const featuredIds = new Set(
        (featuredItems.length > 0 ? featuredItems : featuredPage.items).map((l) => l.id),
      );
      setBrowse(browsePage.items.filter((l) => !featuredIds.has(l.id)));
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

  const onHostPress = async () => {
    if (roles.includes('host')) {
      await switchRole('host');
      return;
    }
    Alert.alert('Become a host', 'Host tools will open here soon.');
  };

  return (
    <View style={styles.root}>
      <ExploreHeader
        onNotificationsPress={() =>
          Alert.alert('Notifications', 'Notification inbox will be available soon.')
        }
        onProfilePress={() => navigation.navigate('Profile')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={colors.primary}
          />
        }
      >
        <ExploreHero
          onSearchPress={() =>
            navigation.navigate('SearchResults', {
              where: BROWSE_CITY,
              city: BROWSE_CITY,
            })
          }
        />

        {loading && featured.length === 0 && browse.length === 0 ? (
          <HomeLoadingSkeleton />
        ) : error && featured.length === 0 && browse.length === 0 ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            <CategoryCarousel
              categories={categories}
              loading={loading && categories.length === 0}
              onSelect={(cat) =>
                navigation.navigate('SearchResults', {
                  where: BROWSE_CITY,
                  city: BROWSE_CITY,
                  category: cat.slug,
                  title: cat.title,
                })
              }
              onViewAll={() =>
                navigation.navigate('SearchResults', {
                  where: BROWSE_CITY,
                  city: BROWSE_CITY,
                  title: 'Categories',
                })
              }
            />

            {featured.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>Handpicked by Dwelis</Text>
                    <View style={styles.curatedPill}>
                      <Text style={styles.curatedText}>Curated for quality & comfort</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => navigation.navigate('HandpickedCollection')} hitSlop={8}>
                    <Text style={styles.viewAll}>View all</Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselRow}
                >
                  {featured.map((listing) => (
                    <HandpickedCard
                      key={listing.id}
                      listing={listing}
                      onPress={() => openListing(listing.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {browse.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { flex: 1 }]}>
                    Browse more stays in {BROWSE_CITY}
                  </Text>
                  <Pressable
                    onPress={() => navigation.navigate('BrowseCityStays', { city: BROWSE_CITY })}
                    hitSlop={8}
                  >
                    <Text style={styles.viewAll}>View all</Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselRow}
                >
                  {browse.map((listing) => (
                    <CompactStayCard
                      key={listing.id}
                      listing={listing}
                      onPress={() => openListing(listing.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <PromoBanners
              onHostPress={() => void onHostPress()}
              onAfricaPress={() =>
                navigation.navigate('SearchResults', {
                  where: 'Africa',
                  title: 'Explore Africa',
                })
              }
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },
  error: {
    ...typography.body,
    color: colors.error,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  section: { marginBottom: spacing.lg, gap: spacing.md },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitleRow: { flex: 1, gap: 6 },
  sectionTitle: { ...typography.headline, color: colors.text },
  curatedPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  curatedText: { fontSize: 11, fontWeight: '600', color: colors.primaryDark },
  viewAll: {
    ...typography.footnote,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 2,
  },
  carouselRow: { paddingHorizontal: spacing.md, gap: spacing.md },
});
