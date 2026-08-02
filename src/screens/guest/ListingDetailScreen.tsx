import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NativeButton } from '@/components/ui/NativeButton';
import { SaveButton } from '@/components/listings/SaveButton';
import { api } from '@/shared/context/AuthContext';
import type { Listing, ListingReview } from '@/shared/types/listing';
import type { RootStackParamList } from '@/navigation/types';
import { formatGhs, listingLocation, listingNightlyPrice } from '@/shared/utils/listingDisplay';
import { normalizePaginated } from '@/shared/utils/pagination';
import { colors, radii, spacing, typography } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(SCREEN_WIDTH * 0.72);
const DESC_PREVIEW = 180;

type Highlight = { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string };

function amenityIcon(name: string): keyof typeof Ionicons.glyphMap {
  const n = name.toLowerCase();
  if (n.includes('wifi') || n.includes('wi-fi')) return 'wifi';
  if (n.includes('air') || n.includes('ac') || n.includes('conditioning')) return 'snow-outline';
  if (n.includes('kitchen')) return 'restaurant-outline';
  if (n.includes('tv')) return 'tv-outline';
  if (n.includes('washer') || n.includes('laundry')) return 'water-outline';
  if (n.includes('pool')) return 'water';
  if (n.includes('park')) return 'car-outline';
  if (n.includes('secur')) return 'shield-checkmark-outline';
  if (n.includes('gym') || n.includes('fitness')) return 'barbell-outline';
  return 'checkmark-circle-outline';
}

function parseHouseRules(raw?: string | null): string[] {
  if (!raw?.trim()) {
    return ['No smoking', 'No parties or events', 'Pets not allowed'];
  }
  return raw
    .split(/\n|•|;|\|/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatReviewDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function normalizeReviews(data: unknown): ListingReview[] {
  if (Array.isArray(data)) return data as ListingReview[];
  const page = normalizePaginated<ListingReview>(data);
  if (page.items.length) return page.items;
  const d = data as { reviews?: ListingReview[]; data?: ListingReview[] } | null;
  if (Array.isArray(d?.reviews)) return d.reviews;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

export function ListingDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ListingDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<ListingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const galleryRef = useRef<ScrollView>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<Listing>(`/listings/${route.params.id}`);
        if (!cancelled) setListing(res.data);
      } catch {
        if (!cancelled) setListing(null);
      } finally {
        if (!cancelled) setLoading(false);
      }

      try {
        const rev = await api.get(`/listings/${route.params.id}/reviews`);
        if (!cancelled) setReviews(normalizeReviews(rev.data));
      } catch {
        if (!cancelled) setReviews([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [route.params.id]);

  const photos = useMemo(() => {
    if (!listing) return [] as string[];
    const fromPhotos = (listing.photos ?? [])
      .slice()
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map((p) => p.url)
      .filter(Boolean);
    if (fromPhotos.length) return fromPhotos;
    return listing.imageUrl ? [listing.imageUrl] : [];
  }, [listing]);

  const amenities = useMemo(() => {
    const names = (listing?.listingAmenities ?? [])
      .map((a) => a.amenity?.name)
      .filter((n): n is string => Boolean(n));
    return names.length
      ? names
      : ['Wi-Fi', 'Air conditioning', 'Kitchen', 'Smart TV', 'Washer', 'Pool', 'Free parking', 'Security'];
  }, [listing]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.overlayBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.error}>Listing not found.</Text>
      </View>
    );
  }

  const location = listingLocation(listing);
  const priceLabel = formatGhs(listingNightlyPrice(listing));
  const highlights: Highlight[] = [
    {
      icon: 'home-outline',
      title: listing.propertyType || 'Entire home',
      subtitle: "You'll have the whole place to yourself",
    },
    {
      icon: 'people-outline',
      title: `${listing.guestsCount ?? '—'} guests`,
      subtitle: 'Max occupancy',
    },
    {
      icon: 'bed-outline',
      title: `${listing.bedroomCount ?? '—'} bedrooms`,
      subtitle: 'Bedrooms',
    },
    {
      icon: 'bed-outline',
      title: `${listing.bedsCount ?? listing.bedroomCount ?? '—'} beds`,
      subtitle: 'Beds',
    },
    {
      icon: 'water-outline',
      title: `${listing.bathroomCount ?? '—'} bathrooms`,
      subtitle: 'Bathrooms',
    },
  ];

  const description = listing.description?.trim() || '';
  const descLong = description.length > DESC_PREVIEW;
  const descShown =
    descExpanded || !descLong ? description : `${description.slice(0, DESC_PREVIEW).trim()}…`;
  const rules = parseHouseRules(listing.houseRules);
  const visibleAmenities = showAllAmenities ? amenities : amenities.slice(0, 8);
  const hostName = listing.host?.fullName?.split(' ')[0] || listing.host?.fullName || 'Host';
  const rating = listing.rating != null ? Number(listing.rating).toFixed(2) : null;
  const reviewCount = listing.reviewCount ?? reviews.length;

  const onShare = async () => {
    try {
      await Share.share({
        message: `${listing.title}${location ? ` · ${location}` : ''}`,
        title: listing.title,
      });
    } catch {
      /* dismissed */
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          {photos.length > 0 ? (
            <ScrollView
              ref={galleryRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setPhotoIndex(idx);
              }}
            >
              {photos.map((uri, i) => (
                <Image key={`${uri}-${i}`} source={{ uri }} style={styles.heroImage} contentFit="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]} />
          )}

          <View style={[styles.overlayTop, { top: insets.top + spacing.sm }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
              style={styles.overlayBtn}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            {listing.guestFavorite ? (
              <View style={styles.favouriteBadge}>
                <Ionicons name="star" size={12} color={colors.primaryDark} />
                <Text style={styles.favouriteText}>Guest Favourite</Text>
              </View>
            ) : (
              <View />
            )}
            <View style={styles.overlayRight}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share"
                onPress={() => void onShare()}
                style={styles.overlayBtn}
                hitSlop={8}
              >
                <Ionicons name="share-outline" size={20} color={colors.text} />
              </Pressable>
              <SaveButton
                listingId={listing.id}
                title={listing.title}
                source="listing_details"
                size={18}
              />
            </View>
          </View>

          {photos.length > 0 ? (
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {photoIndex + 1} / {photos.length}
              </Text>
            </View>
          ) : null}
        </View>

        {photos.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbs}
          >
            {photos.map((uri, i) => (
              <Pressable
                key={`thumb-${i}`}
                onPress={() => {
                  setPhotoIndex(i);
                  galleryRef.current?.scrollTo({ x: i * SCREEN_WIDTH, animated: true });
                }}
              >
                <Image
                  source={{ uri }}
                  style={[styles.thumb, i === photoIndex && styles.thumbActive]}
                  contentFit="cover"
                />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.content}>
          <Text style={styles.title}>{listing.title}</Text>
          {location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.location}>{location}</Text>
            </View>
          ) : null}
          {rating ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.primaryDark} />
              <Text style={styles.rating}>{rating}</Text>
              {reviewCount > 0 ? (
                <Text style={styles.reviewCount}>({reviewCount} reviews)</Text>
              ) : null}
            </View>
          ) : null}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.highlights}
          >
            {highlights.map((h) => (
              <View key={h.title} style={styles.highlightCard}>
                <Ionicons name={h.icon} size={20} color={colors.primaryDark} />
                <Text style={styles.highlightTitle} numberOfLines={1}>
                  {h.title}
                </Text>
                <Text style={styles.highlightSub} numberOfLines={2}>
                  {h.subtitle}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.hostCard}>
            {listing.host?.avatarUrl ? (
              <Image
                source={{ uri: listing.host.avatarUrl }}
                style={styles.hostAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.hostAvatar, styles.hostAvatarFallback]}>
                <Text style={styles.hostLetter}>{hostName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.hostMeta}>
              <View style={styles.hostNameRow}>
                <Text style={styles.hostName}>Hosted by {hostName}</Text>
                {listing.host?.isVerified ? (
                  <View style={styles.verifiedPill}>
                    <Ionicons name="shield-checkmark" size={12} color={colors.primaryDark} />
                    <Text style={styles.verifiedText}>Verified Host</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.hostSub}>Superhost</Text>
            </View>
          </View>

          {description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this place</Text>
              <Text style={styles.bodyText}>{descShown}</Text>
              {descLong ? (
                <Pressable
                  onPress={() => setDescExpanded((v) => !v)}
                  style={styles.readMore}
                  hitSlop={8}
                >
                  <Text style={styles.link}>{descExpanded ? 'Show less' : 'Read more'}</Text>
                  <Ionicons
                    name={descExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.primaryDark}
                  />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What this place offers</Text>
            <View style={styles.amenityGrid}>
              {visibleAmenities.map((name) => (
                <View key={name} style={styles.amenityItem}>
                  <Ionicons name={amenityIcon(name)} size={20} color={colors.text} />
                  <Text style={styles.amenityLabel} numberOfLines={2}>
                    {name}
                  </Text>
                </View>
              ))}
            </View>
            {amenities.length > 8 ? (
              <Pressable
                style={styles.outlineBtn}
                onPress={() => setShowAllAmenities((v) => !v)}
              >
                <Text style={styles.outlineBtnText}>
                  {showAllAmenities ? 'Show fewer amenities' : 'Show all amenities'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>House rules</Text>
            <View style={styles.ruleRow}>
              <Ionicons name="time-outline" size={18} color={colors.text} />
              <Text style={styles.ruleText}>
                Check-in{listing.checkInTime ? `: From ${listing.checkInTime}` : ': From 3:00 PM'}
              </Text>
            </View>
            <View style={styles.ruleRow}>
              <Ionicons name="time-outline" size={18} color={colors.text} />
              <Text style={styles.ruleText}>
                Check-out{listing.checkOutTime ? `: Until ${listing.checkOutTime}` : ': Until 11:00 AM'}
              </Text>
            </View>
            {rules.map((rule) => (
              <View key={rule} style={styles.ruleRow}>
                <Ionicons name="close-circle-outline" size={18} color={colors.text} />
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Where you'll be</Text>
            <View style={styles.mapRow}>
              <View style={styles.mapPlaceholder}>
                <Ionicons name="location" size={28} color={colors.primaryDark} />
                <Text style={styles.mapHint}>Map preview</Text>
              </View>
              <View style={styles.mapMeta}>
                <Text style={styles.mapTitle}>{listing.city || location || 'Neighborhood'}</Text>
                <Text style={styles.bodyText} numberOfLines={4}>
                  {location
                    ? `Explore the area around ${location}. Exact address shared after booking.`
                    : 'Exact address shared after booking.'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <View>
                {rating ? <Text style={styles.bigRating}>{rating}</Text> : null}
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Ionicons key={i} name="star" size={14} color={colors.primaryDark} />
                  ))}
                </View>
                <Text style={styles.basedOn}>
                  {reviewCount > 0 ? `Based on ${reviewCount} reviews` : 'No reviews yet'}
                </Text>
              </View>
            </View>
            {reviews.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.reviewCards}
              >
                {reviews.map((r) => {
                  const name =
                    r.guest?.fullName || r.guestName || r.authorName || 'Guest';
                  const body = r.comment || r.content || '';
                  return (
                    <View key={r.id} style={styles.reviewCard}>
                      <View style={styles.reviewTop}>
                        {r.guest?.avatarUrl || r.avatarUrl ? (
                          <Image
                            source={{ uri: (r.guest?.avatarUrl || r.avatarUrl)! }}
                            style={styles.reviewAvatar}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[styles.reviewAvatar, styles.hostAvatarFallback]}>
                            <Text style={styles.hostLetter}>{name.charAt(0).toUpperCase()}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reviewName} numberOfLines={1}>
                            {name}
                          </Text>
                          <Text style={styles.reviewMeta} numberOfLines={1}>
                            {[r.location, formatReviewDate(r.createdAt)].filter(Boolean).join(' · ')}
                          </Text>
                        </View>
                        {r.rating != null ? (
                          <Text style={styles.reviewScore}>{Number(r.rating).toFixed(1)}</Text>
                        ) : null}
                      </View>
                      {body ? (
                        <Text style={styles.reviewBody} numberOfLines={3}>
                          {body}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <View style={styles.priceCol}>
          <Text style={styles.priceLine}>
            {priceLabel}
            <Text style={styles.perNight}> / night</Text>
          </Text>
          <Text style={styles.datesPlaceholder}>Add dates · Add guests</Text>
        </View>
        <NativeButton
          label="Reserve"
          onPress={() => Alert.alert('Coming soon', 'Booking checkout coming soon')}
          style={styles.reserveBtn}
        />
        <View style={styles.chargeHint}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primaryDark} />
          <Text style={styles.chargeText}>You won't be charged yet</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  error: { ...typography.body, color: colors.error },
  heroWrap: { width: SCREEN_WIDTH, height: HERO_HEIGHT, backgroundColor: colors.border },
  heroImage: { width: SCREEN_WIDTH, height: HERO_HEIGHT },
  heroPlaceholder: { backgroundColor: colors.border },
  overlayTop: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overlayRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  overlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favouriteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  favouriteText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  counter: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterText: { ...typography.caption, color: '#fff', fontWeight: '600' },
  thumbs: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm },
  thumb: {
    width: 72,
    height: 56,
    borderRadius: radii.sm,
    backgroundColor: colors.border,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: { borderColor: colors.primary },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.md },
  title: { ...typography.title2, color: colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -4 },
  location: { ...typography.subhead, color: colors.textSecondary, flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 },
  rating: { ...typography.subhead, fontWeight: '700', color: colors.text },
  reviewCount: { ...typography.subhead, color: colors.textSecondary },
  highlights: { gap: spacing.sm, paddingVertical: spacing.xs },
  highlightCard: {
    width: 132,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: 4,
    backgroundColor: colors.surface,
  },
  highlightTitle: { ...typography.footnote, fontWeight: '700', color: colors.text },
  highlightSub: { fontSize: 11, color: colors.textSecondary, lineHeight: 14 },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  hostAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.border },
  hostAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  hostLetter: { ...typography.headline, color: colors.primaryDark },
  hostMeta: { flex: 1, gap: 4 },
  hostNameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  hostName: { ...typography.headline, color: colors.text },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedText: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },
  hostSub: { ...typography.footnote, color: colors.textSecondary },
  section: { gap: spacing.sm, paddingTop: spacing.sm },
  sectionTitle: { ...typography.headline, color: colors.text },
  bodyText: { ...typography.subhead, color: colors.textSecondary, lineHeight: 22 },
  readMore: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  link: { ...typography.subhead, fontWeight: '700', color: colors.primaryDark },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  amenityItem: { width: '45%', flexDirection: 'row', alignItems: 'center', gap: 10 },
  amenityLabel: { ...typography.subhead, color: colors.text, flex: 1 },
  outlineBtn: {
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: { ...typography.headline, color: colors.primaryDark },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  ruleText: { ...typography.subhead, color: colors.text, flex: 1 },
  mapRow: { flexDirection: 'row', gap: spacing.md },
  mapPlaceholder: {
    width: 120,
    height: 110,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mapHint: { ...typography.caption, color: colors.primaryDark, fontWeight: '600' },
  mapMeta: { flex: 1, gap: 6, justifyContent: 'center' },
  mapTitle: { ...typography.headline, color: colors.text },
  reviewsHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  bigRating: { ...typography.title1, color: colors.text },
  starsRow: { flexDirection: 'row', gap: 2, marginVertical: 4 },
  basedOn: { ...typography.footnote, color: colors.textSecondary },
  reviewCards: { gap: spacing.md, paddingVertical: spacing.xs },
  reviewCard: {
    width: 260,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.border },
  reviewName: { ...typography.footnote, fontWeight: '700', color: colors.text },
  reviewMeta: { ...typography.caption, color: colors.textSecondary },
  reviewScore: { ...typography.footnote, fontWeight: '700', color: colors.primaryDark },
  reviewBody: { ...typography.footnote, color: colors.textSecondary, lineHeight: 18 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
  },
  priceCol: { flex: 1, minWidth: 140, gap: 2 },
  priceLine: { ...typography.headline, color: colors.text },
  perNight: { ...typography.footnote, fontWeight: '400', color: colors.textSecondary },
  datesPlaceholder: { ...typography.caption, color: colors.textSecondary },
  reserveBtn: { minWidth: 120, paddingHorizontal: 28 },
  chargeHint: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: -4,
  },
  chargeText: { ...typography.caption, color: colors.primaryDark, fontWeight: '600' },
});
