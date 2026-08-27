import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
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
import { SearchSheet, type SearchField } from '@/components/explore/SearchSheet';
import { HomeLoadingSkeleton } from '@/components/ui/Skeleton';
import { api, useAuth } from '@/shared/context/AuthContext';
import { normalizePaginated } from '@/shared/utils/pagination';
import {
  emptySearchDraft,
  formatDateRange,
  formatGuests,
  totalGuests,
  type SearchDraft,
} from '@/shared/utils/searchDraft';
import type { HomepageCategory, Listing } from '@/shared/types/listing';
import type { GuestTabParamList, RootStackParamList, SearchParams } from '@/navigation/types';
import { colors, minTouchSize, radii, spacing, typography } from '@/theme';

type ExploreNav = CompositeNavigationProp<
  BottomTabNavigationProp<GuestTabParamList, 'Explore'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const BROWSE_CITY = 'Accra';

const linkRipple = Platform.select({
  android: { color: colors.ripple },
  default: undefined,
});

export function ExploreScreen() {
  const navigation = useNavigation<ExploreNav>();
  const { switchRole, roles } = useAuth();
  const [categories, setCategories] = useState<HomepageCategory[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [browse, setBrowse] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<SearchDraft>(emptySearchDraft);
  const [sheetField, setSheetField] = useState<SearchField>('where');
  const [sheetVisible, setSheetVisible] = useState(false);

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
      setError('Could not load stays. Check your connection and try again.');
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

  const openSheet = (field: SearchField) => {
    setSheetField(field);
    setSheetVisible(true);
  };

  const runSearch = (next: SearchDraft) => {
    const guests = totalGuests(next);
    const params: SearchParams = {
      where: next.where || BROWSE_CITY,
      city: next.city || next.where || BROWSE_CITY,
      dates: formatDateRange(next.checkIn, next.checkOut) ?? undefined,
      guests: formatGuests(next) ?? undefined,
      checkIn: next.checkIn,
      checkOut: next.checkOut,
      guestsCount: guests > 0 ? guests : undefined,
    };
    navigation.navigate('SearchResults', params);
  };

  const dateLabel = formatDateRange(draft.checkIn, draft.checkOut);
  const guestLabel = formatGuests(draft);
  const showSkeleton = loading && featured.length === 0 && browse.length === 0;
  const showError = !!error && featured.length === 0 && browse.length === 0;

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
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        <ExploreHero
          where={draft.where}
          dates={dateLabel}
          guests={guestLabel}
          onFieldPress={openSheet}
          onSearchPress={() => runSearch(draft)}
        />

        {showSkeleton ? (
          <HomeLoadingSkeleton />
        ) : showError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Try loading stays again"
              android_ripple={Platform.select({
                android: { color: colors.rippleLight },
                default: undefined,
              })}
              onPress={() => void load()}
              style={({ pressed }) => [
                styles.retryBtn,
                pressed && Platform.OS === 'ios' && styles.retryPressed,
              ]}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
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
                    <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.5}>
                      Handpicked by Dwelis
                    </Text>
                    <View style={styles.curatedPill}>
                      <Text style={styles.curatedText} maxFontSizeMultiplier={1.4}>
                        Curated for quality &amp; comfort
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="View all handpicked stays"
                    android_ripple={linkRipple}
                    onPress={() => navigation.navigate('HandpickedCollection')}
                    style={styles.viewAllBtn}
                  >
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
                  <Text
                    style={[styles.sectionTitle, styles.sectionTitleWide]}
                    maxFontSizeMultiplier={1.5}
                  >
                    Browse more stays in {BROWSE_CITY}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View all stays in ${BROWSE_CITY}`}
                    android_ripple={linkRipple}
                    onPress={() => navigation.navigate('BrowseCityStays', { city: BROWSE_CITY })}
                    style={styles.viewAllBtn}
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
          </>
        )}

        {/* Static content — no need to gate it behind the rail requests. */}
        <PromoBanners
          onHostPress={() => void onHostPress()}
          onAfricaPress={() =>
            navigation.navigate('SearchResults', {
              where: 'Africa',
              title: 'Explore Africa',
            })
          }
        />
      </ScrollView>

      <SearchSheet
        visible={sheetVisible}
        focusField={sheetField}
        value={draft}
        onClose={() => setSheetVisible(false)}
        onSubmit={(next) => {
          setDraft(next);
          setSheetVisible(false);
          runSearch(next);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.lg },
  errorBox: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  errorTitle: { ...typography.headline, color: colors.text },
  errorBody: { ...typography.subhead, color: colors.textSecondary },
  retryBtn: {
    marginTop: spacing.xs,
    minHeight: minTouchSize,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  retryPressed: { opacity: 0.9 },
  retryText: { ...typography.subhead, fontWeight: '700', color: '#fff' },
  section: { marginBottom: spacing.lg, gap: spacing.md },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.headline, color: colors.text },
  sectionTitleWide: { flex: 1 },
  curatedPill: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  curatedText: { fontSize: 11, fontWeight: '600', color: colors.primaryDark },
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
  carouselRow: { paddingHorizontal: spacing.md, gap: spacing.md },
});
