import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { HostHeader } from '@/components/host/HostHeader';
import { NativeButton } from '@/components/ui/NativeButton';
import { api, useAuth } from '@/shared/context/AuthContext';
import {
  coverUrl,
  mockHealth,
  type HostListing,
  type HostReservation,
  type TodayBookingItem,
} from '@/shared/types/host';
import { normalizePaginated } from '@/shared/utils/pagination';
import type { HostTabParamList, RootStackParamList } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<HostTabParamList, 'Overview'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type OpsTab = 'check_in' | 'check_out' | 'cleaning';

type PerformanceMonth = { month: string; paid: number; upcoming?: number; total?: number };
type PerformanceSummary = { year: number; currency?: string; months: PerformanceMonth[] };
type OccupancyAnalytics = { occupancyPercentage?: number };

const QUICK_ACTIONS: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
}[] = [
  {
    key: 'create',
    label: 'Create Reservation',
    icon: 'calendar-outline',
    message: 'Create reservation is coming soon.',
  },
  {
    key: 'block',
    label: 'Block Dates',
    icon: 'calendar-clear-outline',
    message: 'Block dates is coming soon.',
  },
  {
    key: 'sync',
    label: 'Sync Calendar',
    icon: 'sync-outline',
    message: 'Calendar sync is coming soon.',
  },
  {
    key: 'cleaner',
    label: 'Invite Cleaner',
    icon: 'person-add-outline',
    message: 'Invite cleaner is coming soon.',
  },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-CA');
}

function greetingForHour(h: number): string {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function firstName(fullName?: string | null): string {
  const n = (fullName ?? '').trim();
  if (!n) return 'Host';
  return n.split(/\s+/)[0];
}

function mockDeltaPercent(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 97;
  return (hash % 31) - 8;
}

function formatMoney(amount: number, currency = 'GHS'): string {
  return `${currency} ${Math.round(amount).toLocaleString()}`;
}

function formatCheckTime(raw?: string | null, fallback = '3:00 PM'): string {
  if (!raw?.trim()) return fallback;
  const t = raw.trim();
  if (/am|pm/i.test(t)) return t.replace(/^from\s+/i, '');
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (m) {
    let h = Number(m[1]);
    const min = m[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${min} ${ampm}`;
  }
  return t;
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function parseListings(data: unknown): HostListing[] {
  if (Array.isArray(data)) return data as HostListing[];
  return normalizePaginated<HostListing>(data).items;
}

function parseTodayBookings(data: unknown): TodayBookingItem[] {
  if (Array.isArray(data)) return data as TodayBookingItem[];
  return normalizePaginated<TodayBookingItem>(data).items;
}

function bookingType(item: TodayBookingItem): 'check_in' | 'check_out' | 'other' {
  const t = (item.type || '').toLowerCase();
  if (t.includes('out') || t === 'checkout' || t === 'check_out') return 'check_out';
  if (t.includes('in') || t === 'checkin' || t === 'check_in') return 'check_in';
  const today = todayIso();
  if (item.checkOutDate === today) return 'check_out';
  if (item.checkInDate === today) return 'check_in';
  return 'other';
}

function DeltaLabel({ seed, label }: { seed: string; label?: string }) {
  const delta = mockDeltaPercent(seed);
  const up = delta >= 0;
  return (
    <Text style={[styles.delta, up ? styles.deltaUp : styles.deltaDown]}>
      {up ? '↑' : '↓'} {Math.abs(delta)}
      {label ?? '% vs last month'}
    </Text>
  );
}

function StatCard({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  seed,
  deltaLabel,
}: {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  seed: string;
  deltaLabel?: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <DeltaLabel seed={seed} label={deltaLabel} />
    </View>
  );
}

export function HostOverviewScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const [listings, setListings] = useState<HostListing[]>([]);
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyAnalytics | null>(null);
  const [todayBookings, setTodayBookings] = useState<TodayBookingItem[]>([]);
  const [reservations, setReservations] = useState<HostReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [opsTab, setOpsTab] = useState<OpsTab>('check_in');

  const load = useCallback(async () => {
    const year = new Date().getFullYear();
    const month = `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    try {
      const [listingsRes, perfRes, occRes, todayRes, resRes] = await Promise.all([
        api.get('/listings/hosts/me').catch(() => ({ data: [] })),
        api
          .get<PerformanceSummary>('/host/analytics/performance', { params: { year } })
          .catch(() => ({ data: null })),
        api
          .get<OccupancyAnalytics>('/host/analytics', { params: { month } })
          .catch(() => ({ data: null })),
        api.get('/bookings/today').catch(() => ({ data: [] })),
        api
          .get('/reservations/host/me', { params: { page: 1, limit: 50 } })
          .catch(() => ({ data: { items: [] } })),
      ]);
      setListings(parseListings(listingsRes.data));
      setPerformance(perfRes.data ?? null);
      setOccupancy(occRes.data ?? null);
      setTodayBookings(parseTodayBookings(todayRes.data));
      setReservations(normalizePaginated<HostReservation>(resRes.data, 50).items);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const monthPerf = performance?.months?.find((m) => m.month === monthKey);
  const currency = performance?.currency ?? 'GHS';
  const mtdEarnings = monthPerf?.paid ?? 0;
  const occupancyPct = Math.round(occupancy?.occupancyPercentage ?? 0);
  const today = todayIso();

  const activeReservations = useMemo(() => {
    return reservations.filter((r) => {
      const s = (r.status || '').toLowerCase();
      if (s.includes('cancel')) return false;
      if (s.includes('complet') || r.checkOutDate <= today) return false;
      return true;
    }).length;
  }, [reservations, today]);

  const opsItems = useMemo(() => {
    if (opsTab === 'cleaning') {
      return todayBookings
        .filter((b) => bookingType(b) === 'check_out')
        .slice(0, 3)
        .map((b) => ({
          id: `clean-${b.id}`,
          kind: 'cleaning' as const,
          guest: b.guest?.fullName || 'Guest',
          property: b.listing?.title || 'Property',
          meta: 'Turnover cleaning',
          time: formatCheckTime(b.checkOutTime, '11:00 AM'),
          thumb: coverUrl(b.listing),
          health: mockHealth(b.id),
        }));
    }
    return todayBookings
      .filter((b) => bookingType(b) === opsTab)
      .map((b) => ({
        id: b.id,
        kind: opsTab,
        guest: b.guest?.fullName || 'Guest',
        property: b.listing?.title || 'Property',
        meta: `${b.guestCount ?? 1} guest${(b.guestCount ?? 1) === 1 ? '' : 's'}`,
        time:
          opsTab === 'check_out'
            ? formatCheckTime(b.checkOutTime, '11:00 AM')
            : formatCheckTime(b.checkInTime, '3:00 PM'),
        thumb: coverUrl(b.listing),
        health: mockHealth(b.id),
      }));
  }, [todayBookings, opsTab]);

  const nextSeven = useMemo(() => {
    const end = addDaysIso(today, 7);
    const rows: {
      id: string;
      kind: 'arrival' | 'departure';
      date: string;
      guest: string;
      property: string;
      time: string;
    }[] = [];

    for (const r of reservations) {
      const s = (r.status || '').toLowerCase();
      if (s.includes('cancel')) continue;
      if (r.checkInDate > today && r.checkInDate <= end) {
        rows.push({
          id: `in-${r.id}`,
          kind: 'arrival',
          date: r.checkInDate,
          guest: r.guest?.fullName || 'Guest',
          property: r.listing?.title || 'Property',
          time: '3:00 PM',
        });
      }
      if (r.checkOutDate > today && r.checkOutDate <= end) {
        rows.push({
          id: `out-${r.id}`,
          kind: 'departure',
          date: r.checkOutDate,
          guest: r.guest?.fullName || 'Guest',
          property: r.listing?.title || 'Property',
          time: '11:00 AM',
        });
      }
    }

    rows.sort((a, b) => a.date.localeCompare(b.date));
    return rows.slice(0, 5);
  }, [reservations, today]);

  const readinessListing = listings[0];
  const readiness = readinessListing ? mockHealth(readinessListing.id) : null;
  const hour = new Date().getHours();
  const greet = `${greetingForHour(hour)}, ${firstName(user?.fullName)}!`;

  const openEditProperty = () => navigation.navigate('HostEditProperty');
  const openCalendar = () => navigation.navigate('Calendar');

  return (
    <View style={styles.root}>
      <HostHeader showLogo title="Overview" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>{greet}</Text>
          <Text style={styles.subtitle}>
            Here&apos;s what&apos;s happening with your hosting business today.
          </Text>
        </View>

        <NativeButton
          label="+ Add Property"
          onPress={openEditProperty}
          style={styles.addBtn}
        />

        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.key}
              style={styles.quickItem}
              onPress={() => Alert.alert(action.label, action.message)}
            >
              <View style={styles.quickIcon}>
                <Ionicons name={action.icon} size={20} color={colors.primaryDark} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard
                title="Monthly Earnings"
                value={formatMoney(mtdEarnings, currency)}
                icon="wallet-outline"
                iconBg={colors.primarySoft}
                iconColor={colors.primaryDark}
                seed={`earn-${monthKey}`}
              />
              <StatCard
                title="Occupancy Rate"
                value={`${occupancyPct}%`}
                icon="stats-chart-outline"
                iconBg="#F4EBFF"
                iconColor="#7C3AED"
                seed={`occ-${monthKey}`}
              />
              <StatCard
                title="Active Reservations"
                value={String(activeReservations)}
                icon="calendar-outline"
                iconBg="#FFFAEB"
                iconColor="#F79009"
                seed={`res-${monthKey}-${activeReservations}`}
              />
              <StatCard
                title="Active Listings"
                value={String(listings.length)}
                icon="home-outline"
                iconBg="#EFF8FF"
                iconColor="#2E90FA"
                seed={`list-${monthKey}-${listings.length}`}
                deltaLabel=" vs last month"
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Today&apos;s Operations</Text>
                  <Text style={styles.sectionSub}>
                    Manage today&apos;s arrivals, departures and cleaning.
                  </Text>
                </View>
                <Pressable onPress={() => navigation.navigate('Bookings')}>
                  <Text style={styles.link}>View all</Text>
                </Pressable>
              </View>

              <View style={styles.opsTabs}>
                {(
                  [
                    { key: 'check_in', label: 'Check-ins' },
                    { key: 'check_out', label: 'Check-outs' },
                    { key: 'cleaning', label: 'Cleaning' },
                  ] as const
                ).map((tab) => {
                  const active = opsTab === tab.key;
                  return (
                    <Pressable
                      key={tab.key}
                      style={[styles.opsTab, active && styles.opsTabActive]}
                      onPress={() => setOpsTab(tab.key)}
                    >
                      <Text style={[styles.opsTabText, active && styles.opsTabTextActive]}>
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {opsItems.length === 0 ? (
                <View style={styles.emptyOps}>
                  <Text style={styles.emptyOpsText}>
                    {opsTab === 'cleaning'
                      ? 'No cleaning tasks for today.'
                      : opsTab === 'check_in'
                        ? 'No check-ins today.'
                        : 'No check-outs today.'}
                  </Text>
                </View>
              ) : (
                opsItems.map((item) => (
                  <View key={item.id} style={styles.opsCard}>
                    {item.thumb ? (
                      <Image source={{ uri: item.thumb }} style={styles.opsThumb} contentFit="cover" />
                    ) : (
                      <View style={[styles.opsThumb, styles.thumbFallback]}>
                        <Ionicons name="image-outline" size={18} color={colors.textTertiary} />
                      </View>
                    )}
                    <View style={styles.opsBody}>
                      <Text style={styles.opsGuest} numberOfLines={1}>
                        {item.guest}
                      </Text>
                      <Text style={styles.opsProperty} numberOfLines={1}>
                        {item.property}
                      </Text>
                      <Text style={styles.opsMeta}>
                        {item.meta} · {item.time}
                      </Text>
                    </View>
                    <View style={styles.opsActions}>
                      <View
                        style={[
                          styles.pill,
                          item.kind === 'cleaning'
                            ? styles.pillWarn
                            : item.kind === 'check_out'
                              ? styles.pillNeutral
                              : styles.pillGood,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            item.kind === 'cleaning'
                              ? styles.pillTextWarn
                              : item.kind === 'check_out'
                                ? styles.pillTextNeutral
                                : styles.pillTextGood,
                          ]}
                        >
                          {item.kind === 'cleaning'
                            ? item.health.label
                            : item.kind === 'check_out'
                              ? 'Departing'
                              : 'Arriving'}
                        </Text>
                      </View>
                      <Pressable
                        style={styles.msgBtn}
                        onPress={() =>
                          Alert.alert('Message', 'Messaging from Overview is coming soon.')
                        }
                      >
                        <Ionicons name="chatbubble-outline" size={16} color={colors.primaryDark} />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Next 7 Days</Text>
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: colors.primaryDark }]} />
                    <Text style={styles.legendText}>Arrivals</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#7C3AED' }]} />
                    <Text style={styles.legendText}>Departures</Text>
                  </View>
                </View>
              </View>

              {nextSeven.length === 0 ? (
                <Text style={styles.emptyOpsText}>No upcoming arrivals or departures.</Text>
              ) : (
                nextSeven.map((row) => (
                  <Pressable
                    key={row.id}
                    style={styles.nextRow}
                    onPress={() => navigation.navigate('Bookings')}
                  >
                    <View
                      style={[
                        styles.nextIcon,
                        {
                          backgroundColor:
                            row.kind === 'arrival' ? colors.primarySoft : '#F4EBFF',
                        },
                      ]}
                    >
                      <Ionicons
                        name={row.kind === 'arrival' ? 'log-in-outline' : 'log-out-outline'}
                        size={16}
                        color={row.kind === 'arrival' ? colors.primaryDark : '#7C3AED'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nextDate}>{formatShortDate(row.date)}</Text>
                      <Text style={styles.nextGuest} numberOfLines={1}>
                        {row.guest} · {row.property}
                      </Text>
                      <Text style={styles.nextTime}>{row.time}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                  </Pressable>
                ))
              )}

              <Pressable onPress={openCalendar} style={styles.calendarLink}>
                <Text style={styles.link}>View Calendar →</Text>
              </Pressable>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Property Readiness</Text>
                <Pressable onPress={() => navigation.navigate('HostProperties')}>
                  <Text style={styles.link}>View all</Text>
                </Pressable>
              </View>

              {!readinessListing || !readiness ? (
                <Text style={styles.emptyOpsText}>Add a property to track readiness.</Text>
              ) : (
                <View style={styles.readyCard}>
                  {coverUrl(readinessListing) ? (
                    <Image
                      source={{ uri: coverUrl(readinessListing) }}
                      style={styles.readyImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.readyImage, styles.thumbFallback]}>
                      <Ionicons name="home-outline" size={28} color={colors.textTertiary} />
                    </View>
                  )}
                  <View style={styles.readyBody}>
                    <View style={styles.readyTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.readyTitle} numberOfLines={1}>
                          {readinessListing.title}
                        </Text>
                        <Text style={styles.readyLoc} numberOfLines={1}>
                          {[readinessListing.area, readinessListing.city].filter(Boolean).join(', ') ||
                            'Ghana'}
                        </Text>
                      </View>
                      <View style={styles.readyPctWrap}>
                        <Text style={styles.readyPct}>{readiness.percent}%</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.pill,
                        readiness.tone === 'bad'
                          ? styles.pillBad
                          : readiness.tone === 'warn'
                            ? styles.pillWarn
                            : styles.pillGood,
                        { alignSelf: 'flex-start' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          readiness.tone === 'bad'
                            ? styles.pillTextBad
                            : readiness.tone === 'warn'
                              ? styles.pillTextWarn
                              : styles.pillTextGood,
                        ]}
                      >
                        {readiness.percent >= 85 ? '✓ Ready' : readiness.label}
                      </Text>
                    </View>
                    <View style={styles.readyBarTrack}>
                      <View
                        style={[
                          styles.readyBarFill,
                          {
                            width: `${readiness.percent}%`,
                            backgroundColor:
                              readiness.tone === 'bad'
                                ? colors.error
                                : readiness.tone === 'warn'
                                  ? '#F79009'
                                  : colors.success,
                          },
                        ]}
                      />
                    </View>
                    <Pressable
                      onPress={() =>
                        Alert.alert('Checklist', 'Property checklist is coming soon.')
                      }
                    >
                      <Text style={styles.link}>View Checklist →</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
  greetingBlock: { gap: 4 },
  greeting: { ...typography.title2, color: colors.text },
  subtitle: { ...typography.subhead, color: colors.textSecondary, lineHeight: 22 },
  addBtn: { minHeight: 48 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  quickItem: { flex: 1, alignItems: 'center', gap: 8 },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  statValue: { ...typography.title3, color: colors.text },
  delta: { ...typography.caption, fontWeight: '600' },
  deltaUp: { color: colors.success },
  deltaDown: { color: colors.error },
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.headline, color: colors.text },
  sectionSub: { ...typography.footnote, color: colors.textSecondary, marginTop: 2 },
  link: { ...typography.footnote, color: colors.primaryDark, fontWeight: '700' },
  opsTabs: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F5',
    borderRadius: radii.full,
    padding: 4,
    gap: 2,
  },
  opsTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.full,
    alignItems: 'center',
  },
  opsTabActive: { backgroundColor: colors.surface },
  opsTabText: { ...typography.footnote, color: colors.textSecondary, fontWeight: '600' },
  opsTabTextActive: { color: colors.text },
  emptyOps: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyOpsText: { ...typography.subhead, color: colors.textSecondary, textAlign: 'center' },
  opsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  opsThumb: { width: 52, height: 52, borderRadius: radii.sm, backgroundColor: colors.border },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  opsBody: { flex: 1, gap: 2 },
  opsGuest: { ...typography.subhead, fontWeight: '700', color: colors.text },
  opsProperty: { ...typography.caption, color: colors.textSecondary },
  opsMeta: { ...typography.caption, color: colors.textTertiary },
  opsActions: { alignItems: 'flex-end', gap: 6 },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  pillGood: { backgroundColor: colors.primarySoft },
  pillWarn: { backgroundColor: '#FFFAEB' },
  pillBad: { backgroundColor: '#FEF3F2' },
  pillNeutral: { backgroundColor: '#F4F4F5' },
  pillText: { ...typography.caption, fontWeight: '700' },
  pillTextGood: { color: colors.primaryDark },
  pillTextWarn: { color: '#B54708' },
  pillTextBad: { color: colors.error },
  pillTextNeutral: { color: colors.textSecondary },
  msgBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { ...typography.caption, color: colors.textSecondary },
  dot: { width: 8, height: 8, borderRadius: 4 },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  nextIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextDate: { ...typography.footnote, fontWeight: '700', color: colors.text },
  nextGuest: { ...typography.caption, color: colors.textSecondary },
  nextTime: { ...typography.caption, color: colors.textTertiary },
  calendarLink: { alignSelf: 'flex-start', paddingTop: spacing.xs },
  readyCard: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  readyImage: { width: '100%', height: 140, backgroundColor: colors.border },
  readyBody: { padding: spacing.md, gap: spacing.sm },
  readyTop: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  readyTitle: { ...typography.headline, color: colors.text },
  readyLoc: { ...typography.footnote, color: colors.textSecondary, marginTop: 2 },
  readyPctWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyPct: { ...typography.footnote, fontWeight: '800', color: colors.primaryDark },
  readyBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F4F4F5',
    overflow: 'hidden',
  },
  readyBarFill: { height: '100%', borderRadius: 3 },
});
