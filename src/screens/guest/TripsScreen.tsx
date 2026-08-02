import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExploreHeader } from '@/components/explore/ExploreHeader';
import { NativeButton } from '@/components/ui/NativeButton';
import { api, useAuth } from '@/shared/context/AuthContext';
import { normalizePaginated } from '@/shared/utils/pagination';
import { listingLocation } from '@/shared/utils/listingDisplay';
import type { Booking } from '@/shared/types/listing';
import type { GuestTabParamList, RootStackParamList } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<GuestTabParamList, 'Trips'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type TripTab = 'upcoming' | 'completed' | 'cancelled';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function classifyTrip(booking: Booking): TripTab {
  const status = (booking.status || '').toLowerCase();
  if (status.includes('cancel')) return 'cancelled';
  if (status.includes('complet') || status.includes('past')) return 'completed';
  const out = new Date(booking.checkOutDate);
  if (!Number.isNaN(out.getTime()) && out < startOfToday()) return 'completed';
  return 'upcoming';
}

function formatTripDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 1;
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

function bookingReference(booking: Booking): string {
  return booking.bookingRef || booking.referenceCode || `DWL-${booking.id.slice(0, 6).toUpperCase()}`;
}

function statusLabel(tab: TripTab): string {
  if (tab === 'upcoming') return 'Upcoming';
  if (tab === 'completed') return 'Completed';
  return 'Cancelled';
}

function TripsEmptyArt() {
  return (
    <View style={styles.art} accessibilityElementsHidden>
      <View style={styles.artCircle}>
        <Ionicons name="home" size={42} color={colors.primaryDark} />
      </View>
      <View style={styles.artHeart}>
        <Ionicons name="heart" size={18} color={colors.primary} />
      </View>
    </View>
  );
}

function TripCard({
  booking,
  bucket,
  onMessage,
  onView,
}: {
  booking: Booking;
  bucket: TripTab;
  onMessage: () => void;
  onView: () => void;
}) {
  const listing = booking.listing;
  const imageUri = listing?.imageUrl;
  const title = listing?.title || 'Stay';
  const location = listing ? listingLocation(listing) : '';
  const ref = bookingReference(booking);
  const nights = nightsBetween(booking.checkInDate, booking.checkOutDate);
  const guests = booking.guestsCount ?? listing?.guestsCount ?? 1;

  const copyRef = () => {
    Clipboard.setString(ref);
    Alert.alert('Copied', 'Booking reference copied to clipboard.');
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardImageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.cardImage} contentFit="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name="image-outline" size={32} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusBadgeText}>{statusLabel(bucket)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <View style={styles.cardTitleCol}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {title}
            </Text>
            {location ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {location}
                </Text>
              </View>
            ) : null}
          </View>
          <Pressable onPress={copyRef} style={styles.refBlock} hitSlop={6}>
            <Text style={styles.refLabel}>Booking Ref.</Text>
            <View style={styles.refRow}>
              <Text style={styles.refValue}>{ref}</Text>
              <Ionicons name="copy-outline" size={14} color={colors.textSecondary} />
            </View>
          </Pressable>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCell}>
            <Ionicons name="calendar-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.metaLabel}>Check-in</Text>
            <Text style={styles.metaValue}>{formatTripDate(booking.checkInDate)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Ionicons name="calendar-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.metaLabel}>Check-out</Text>
            <Text style={styles.metaValue}>{formatTripDate(booking.checkOutDate)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Ionicons name="moon-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.metaLabel}>Nights</Text>
            <Text style={styles.metaValue}>
              {nights} {nights === 1 ? 'night' : 'nights'}
            </Text>
          </View>
          <View style={styles.metaCell}>
            <Ionicons name="person-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.metaLabel}>Guests</Text>
            <Text style={styles.metaValue}>
              {guests} {guests === 1 ? 'guest' : 'guests'}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <Pressable style={styles.messageBtn} onPress={onMessage}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
            <Text style={styles.messageBtnText}>Message Host</Text>
          </Pressable>
          <Pressable style={styles.viewBtn} onPress={onView}>
            <Text style={styles.viewBtnText}>View Booking</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function TripsScreen() {
  const navigation = useNavigation<Nav>();
  const { token } = useAuth();
  const [trips, setTrips] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TripTab>('upcoming');

  const load = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setTrips([]);
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await api.get('/bookings/my');
        const page = normalizePaginated<Booking>(res.data);
        setTrips(page.items);
      } catch {
        setTrips([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filtered = useMemo(
    () => trips.filter((t) => classifyTrip(t) === tab),
    [trips, tab],
  );

  const openHandpicked = () => {
    const parent = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    if (parent) {
      parent.navigate('HandpickedCollection');
    } else {
      navigation.navigate('HandpickedCollection');
    }
  };

  return (
    <View style={styles.root}>
      <ExploreHeader onProfilePress={() => navigation.navigate('Profile')} />

      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Trips</Text>
          <Pressable hitSlop={8} onPress={() => Alert.alert('Filters', 'Trip filters coming soon.')}>
            <Ionicons name="options-outline" size={22} color={colors.text} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Manage your upcoming, active and past stays.</Text>
      </View>

      <View style={styles.tabs}>
        {(['upcoming', 'completed', 'cancelled'] as TripTab[]).map((key) => {
          const active = tab === key;
          return (
            <Pressable key={key} style={styles.tab} onPress={() => setTab(key)}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {statusLabel(key)}
              </Text>
              {active ? <View style={styles.tabUnderline} /> : null}
            </Pressable>
          );
        })}
      </View>

      {!token ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sign in to see your trips</Text>
          <Text style={styles.emptyBody}>Your bookings will appear here after you sign in.</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={colors.primary}
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <TripsEmptyArt />
              <Text style={styles.emptyTitle}>
                {tab === 'upcoming' ? 'No trips yet' : `No ${statusLabel(tab).toLowerCase()} trips`}
              </Text>
              <Text style={styles.emptyBody}>
                {tab === 'upcoming'
                  ? 'When you book your first stay, your upcoming reservations will appear here.'
                  : `You don't have any ${statusLabel(tab).toLowerCase()} stays right now.`}
              </Text>
              {tab === 'upcoming' ? (
                <>
                  <NativeButton
                    label="Explore Stays"
                    onPress={() => navigation.navigate('Explore')}
                    style={{ alignSelf: 'stretch', marginTop: spacing.md }}
                  />
                  <NativeButton
                    label="Browse Featured Homes"
                    variant="secondary"
                    onPress={openHandpicked}
                    style={{ alignSelf: 'stretch' }}
                  />
                </>
              ) : null}
            </View>
          ) : (
            filtered.map((booking) => (
              <TripCard
                key={booking.id}
                booking={booking}
                bucket={tab}
                onMessage={() => {
                  try {
                    navigation.navigate('Messages');
                  } catch {
                    Alert.alert('Messages', 'Open Messages to chat with your host.');
                  }
                }}
                onView={() =>
                  Alert.alert('Coming soon', 'Booking details will be available soon.')
                }
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  titleBlock: { paddingHorizontal: spacing.md, marginBottom: spacing.sm, gap: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { ...typography.title1, color: colors.text },
  subtitle: { ...typography.subhead, color: colors.textSecondary },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  tab: { marginRight: spacing.lg, paddingBottom: 10 },
  tabLabel: { ...typography.subhead, fontWeight: '600', color: colors.textSecondary },
  tabLabelActive: { color: colors.primaryDark },
  tabUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardImageWrap: { position: 'relative' },
  cardImage: { width: '100%', height: 160, backgroundColor: colors.border },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryDark,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  cardBody: { padding: spacing.md, gap: spacing.md },
  cardTitleRow: { flexDirection: 'row', gap: spacing.sm },
  cardTitleCol: { flex: 1, gap: 4 },
  cardTitle: { ...typography.headline, color: colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { ...typography.footnote, color: colors.textSecondary, flex: 1 },
  refBlock: { alignItems: 'flex-end', gap: 2 },
  refLabel: { ...typography.caption, color: colors.textSecondary },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refValue: { ...typography.footnote, fontWeight: '700', color: colors.text },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  metaCell: { width: '25%', gap: 2, paddingRight: 4 },
  metaLabel: { ...typography.caption, color: colors.textSecondary },
  metaValue: { fontSize: 12, fontWeight: '600', color: colors.text },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  messageBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
  },
  messageBtnText: { ...typography.footnote, fontWeight: '700', color: colors.text },
  viewBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewBtnText: { ...typography.footnote, fontWeight: '700', color: '#fff' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.title3, color: colors.text, marginTop: spacing.md },
  emptyBody: {
    ...typography.subhead,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  art: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artHeart: {
    position: 'absolute',
    top: 12,
    right: 18,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
