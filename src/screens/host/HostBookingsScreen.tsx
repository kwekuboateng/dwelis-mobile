import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HostHeader } from '@/components/host/HostHeader';
import { NativeButton } from '@/components/ui/NativeButton';
import { api, useAuth } from '@/shared/context/AuthContext';
import { coverUrl, mockHealth, type HostReservation } from '@/shared/types/host';
import { formatGhs } from '@/shared/utils/listingDisplay';
import { normalizePaginated } from '@/shared/utils/pagination';
import type { HostTabParamList, RootStackParamList } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<HostTabParamList, 'Bookings'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type StayTab = 'all' | 'upcoming' | 'in_stay' | 'completed' | 'cancelled';

const STAY_TABS: { key: StayTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in_stay', label: 'In Stay' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const TIMELINE_STEPS = ['Booked', 'Confirmed', 'Check-in', 'Stay', 'Completed'] as const;

const FAB_ACTIONS: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  section: 'new' | 'availability';
}[] = [
  { key: 'direct', label: 'Direct Booking', icon: 'flash-outline', section: 'new' },
  { key: 'manual', label: 'Manual Booking', icon: 'create-outline', section: 'new' },
  { key: 'block', label: 'Block Dates', icon: 'lock-closed-outline', section: 'availability' },
  { key: 'owner', label: 'Owner Stay', icon: 'person-outline', section: 'availability' },
  { key: 'maint', label: 'Maintenance', icon: 'construct-outline', section: 'availability' },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function stayBucket(r: HostReservation, today = todayIso()): Exclude<StayTab, 'all'> {
  const s = (r.status || '').toLowerCase();
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('complet') || r.checkOutDate <= today) return 'completed';
  if (r.checkInDate <= today && r.checkOutDate > today) return 'in_stay';
  return 'upcoming';
}

function stayPill(bucket: Exclude<StayTab, 'all'>): { label: string; bg: string; fg: string } {
  switch (bucket) {
    case 'upcoming':
      return { label: 'Confirmed', bg: colors.primarySoft, fg: colors.primaryDark };
    case 'in_stay':
      return { label: 'In Stay', bg: '#EFF8FF', fg: '#175CD3' };
    case 'completed':
      return { label: 'Completed', bg: '#F4F4F5', fg: '#52525B' };
    case 'cancelled':
      return { label: 'Cancelled', bg: '#FEF3F2', fg: '#B42318' };
  }
}

function nightsBetween(checkIn: string, checkOut: string, fallback?: number | null): number {
  if (fallback != null && fallback > 0) return fallback;
  const a = new Date(`${checkIn}T12:00:00`).getTime();
  const b = new Date(`${checkOut}T12:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 1;
  return Math.max(1, Math.round((b - a) / 86400000));
}

function formatRange(checkIn: string, checkOut: string): string {
  const a = new Date(`${checkIn}T12:00:00`);
  const b = new Date(`${checkOut}T12:00:00`);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return `${checkIn} – ${checkOut}`;
  return `${a.toLocaleDateString(undefined, opts)} – ${b.toLocaleDateString(undefined, opts)}`;
}

function shortBookingId(id: string, ref?: string | null): string {
  if (ref) return ref.startsWith('#') ? ref : `#${ref}`;
  return `#DW-${id.replace(/-/g, '').slice(0, 5).toUpperCase()}`;
}

function guestNameOf(r: HostReservation): string {
  return r.guest?.fullName || r.guest?.email || r.guest?.phoneNumber || 'Guest';
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function opBadge(health: ReturnType<typeof mockHealth>): { label: string; bg: string; fg: string } {
  if (health.tone === 'bad') return { label: 'Maintenance', bg: '#FEF3F2', fg: '#B42318' };
  if (health.tone === 'warn') return { label: 'Cleaning', bg: '#FFFAEB', fg: '#B54708' };
  return { label: 'Ready', bg: colors.primarySoft, fg: colors.primaryDark };
}

function healthColor(tone: 'good' | 'warn' | 'bad'): string {
  if (tone === 'bad') return colors.error;
  if (tone === 'warn') return '#F79009';
  return colors.success;
}

function timelineActiveIndex(bucket: Exclude<StayTab, 'all'>, status: string): number {
  if (bucket === 'cancelled') return 1;
  if (bucket === 'completed') return 4;
  if (bucket === 'in_stay') return 3;
  const s = status.toLowerCase();
  if (s.includes('confirm') || s.includes('paid') || s.includes('accept')) return 1;
  return 1;
}

function amountLabel(value: string | number | null | undefined): string {
  if (value == null || value === '') return 'GHS —';
  const n = Number(value);
  if (!Number.isFinite(n)) return formatGhs(String(value));
  return `GHS ${Math.round(n).toLocaleString()}`;
}

function BookingCard({
  reservation,
  onPress,
}: {
  reservation: HostReservation;
  onPress: () => void;
}) {
  const bucket = stayBucket(reservation);
  const pill = stayPill(bucket);
  const health = mockHealth(reservation.id);
  const op = opBadge(health);
  const guest = guestNameOf(reservation);
  const nights = nightsBetween(
    reservation.checkInDate,
    reservation.checkOutDate,
    reservation.nightCount,
  );
  const thumb = coverUrl(reservation.listing);
  const activeStep = timelineActiveIndex(bucket, reservation.status);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={styles.guestRow}>
          {reservation.guest?.avatarUrl ? (
            <Image
              source={{ uri: reservation.guest.avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>{initialsOf(guest)}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.guestName} numberOfLines={1}>
              {guest}
            </Text>
            <Text style={styles.guestMeta}>
              {reservation.guestCount ?? 1} guest{(reservation.guestCount ?? 1) === 1 ? '' : 's'}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
            <Text style={[styles.statusPillText, { color: pill.fg }]}>{pill.label}</Text>
          </View>
        </View>

        <View style={styles.propertyRow}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback]}>
              <Ionicons name="home-outline" size={16} color={colors.textTertiary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.propertyTitle} numberOfLines={1}>
              {reservation.listing?.title || 'Property'}
            </Text>
            <Text style={styles.propertyMeta} numberOfLines={1}>
              {formatRange(reservation.checkInDate, reservation.checkOutDate)} · {nights} night
              {nights === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        <View style={styles.channelRow}>
          <View style={styles.channelChip}>
            <Ionicons name="home" size={12} color={colors.primaryDark} />
            <Text style={styles.channelText}>Dwelis</Text>
          </View>
          <Text style={styles.amount}>{amountLabel(reservation.totalPrice)}</Text>
        </View>

        <View style={styles.healthBlock}>
          <View style={styles.healthHeader}>
            <Text style={styles.healthLabel}>Booking Health</Text>
            <View style={styles.healthRight}>
              <View style={[styles.healthDot, { backgroundColor: healthColor(health.tone) }]} />
              <Text style={styles.healthValue}>{health.label}</Text>
            </View>
          </View>
          <View style={[styles.opPill, { backgroundColor: op.bg }]}>
            <Text style={[styles.opPillText, { color: op.fg }]}>{op.label}</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${health.percent}%`,
                  backgroundColor: healthColor(health.tone),
                },
              ]}
            />
          </View>
          <Text style={styles.percentText}>{health.percent}%</Text>
        </View>

        <View style={styles.timeline}>
          {TIMELINE_STEPS.map((step, index) => {
            const done = index <= activeStep && bucket !== 'cancelled';
            const current = index === activeStep && bucket !== 'cancelled';
            return (
              <View key={step} style={styles.timelineStep}>
                <View style={styles.timelineNodeRow}>
                  {index > 0 ? (
                    <View style={[styles.timelineLine, done && styles.timelineLineDone]} />
                  ) : (
                    <View style={styles.timelineLineSpacer} />
                  )}
                  <View
                    style={[
                      styles.timelineNode,
                      done && styles.timelineNodeDone,
                      current && styles.timelineNodeCurrent,
                    ]}
                  >
                    {done ? <Ionicons name="checkmark" size={10} color="#fff" /> : null}
                  </View>
                  {index < TIMELINE_STEPS.length - 1 ? (
                    <View
                      style={[
                        styles.timelineLine,
                        index < activeStep && bucket !== 'cancelled' && styles.timelineLineDone,
                      ]}
                    />
                  ) : (
                    <View style={styles.timelineLineSpacer} />
                  )}
                </View>
                <Text style={styles.timelineLabel}>{step}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </Pressable>
  );
}

export function HostBookingsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [items, setItems] = useState<HostReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stayTab, setStayTab] = useState<StayTab>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<HostReservation | null>(null);
  const [fabOpen, setFabOpen] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setItems([]);
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await api.get('/reservations/host/me', { params: { page: 1, limit: 50 } });
        setItems(normalizePaginated<HostReservation>(res.data, 50).items);
      } catch {
        setItems([]);
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

  const counts = useMemo(() => {
    const c: Record<StayTab, number> = {
      all: items.length,
      upcoming: 0,
      in_stay: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const r of items) c[stayBucket(r)] += 1;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      if (stayTab !== 'all' && stayBucket(r) !== stayTab) return false;
      if (!q) return true;
      const hay = [
        guestNameOf(r),
        r.listing?.title,
        r.listing?.city,
        r.bookingRef,
        r.referenceCode,
        r.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, stayTab, search]);

  const selectedBucket = selected ? stayBucket(selected) : null;
  const selectedHealth = selected ? mockHealth(selected.id) : null;
  const selectedPill = selectedBucket ? stayPill(selectedBucket) : null;

  const messageGuest = (r: HostReservation) => {
    setSelected(null);
    navigation.navigate('ChatThread', {
      conversationId: r.id,
      kind: 'reservation',
      title: guestNameOf(r),
      subtitle: r.listing?.title,
      hostName: guestNameOf(r),
      role: 'host',
    });
  };

  const onFabAction = (key: string) => {
    setFabOpen(false);
    if (key === 'block') {
      navigation.navigate('Calendar');
      return;
    }
    const label = FAB_ACTIONS.find((a) => a.key === key)?.label ?? 'Action';
    Alert.alert(label, `${label} is coming soon.`);
  };

  const filterStub = (name: string) =>
    Alert.alert(name, `${name} filters are coming soon.`);

  return (
    <View style={styles.root}>
      <HostHeader
        title="Bookings"
        onSearchPress={() => Alert.alert('Search', 'Use the search field below.')}
      />

      <View style={styles.tabsWrap}>
        <FlatList
          horizontal
          data={STAY_TABS}
          keyExtractor={(t) => t.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item: tab }) => {
            const active = stayTab === tab.key;
            return (
              <Pressable
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setStayTab(tab.key)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label} ({counts[tab.key]})
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <ScrollFilters
        onProperty={() => filterStub('Property')}
        onStatus={() => filterStub('Status')}
        onDate={() => filterStub('Date')}
        onFilter={() => filterStub('Filter')}
      />

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search bookings, guests, properties..."
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            filtered.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="briefcase-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptyBody}>
                Reservations for your properties will show up here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <BookingCard reservation={item} onPress={() => setSelected(item)} />
          )}
        />
      )}

      <Pressable
        style={[styles.fab, { bottom: Math.max(insets.bottom, 12) + 8 }]}
        onPress={() => setFabOpen(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <Modal visible={fabOpen} transparent animationType="fade" onRequestClose={() => setFabOpen(false)}>
        <Pressable style={styles.fabBackdrop} onPress={() => setFabOpen(false)}>
          <View style={[styles.fabMenu, { bottom: Math.max(insets.bottom, 12) + 72 }]}>
            <Text style={styles.fabSection}>New</Text>
            {FAB_ACTIONS.filter((a) => a.section === 'new').map((action) => (
              <Pressable
                key={action.key}
                style={styles.fabRow}
                onPress={() => onFabAction(action.key)}
              >
                <Ionicons name={action.icon} size={18} color={colors.text} />
                <Text style={styles.fabRowLabel}>{action.label}</Text>
              </Pressable>
            ))}
            <Text style={[styles.fabSection, { marginTop: spacing.sm }]}>Availability</Text>
            {FAB_ACTIONS.filter((a) => a.section === 'availability').map((action) => (
              <Pressable
                key={action.key}
                style={styles.fabRow}
                onPress={() => onFabAction(action.key)}
              >
                <Ionicons name={action.icon} size={18} color={colors.text} />
                <Text style={styles.fabRowLabel}>{action.label}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.fabCancel} onPress={() => setFabOpen(false)}>
              <Text style={styles.fabCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSelected(null)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Booking Workspace</Text>
                <Text style={styles.sheetRef}>
                  {selected
                    ? shortBookingId(selected.id, selected.bookingRef || selected.referenceCode)
                    : ''}
                </Text>
              </View>
              {selectedPill ? (
                <View style={[styles.statusPill, { backgroundColor: selectedPill.bg }]}>
                  <Text style={[styles.statusPillText, { color: selectedPill.fg }]}>
                    {selectedPill.label}
                  </Text>
                </View>
              ) : null}
              <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            {selected && selectedHealth ? (
              <>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryCol}>
                    <Text style={styles.summaryLabel}>Guest</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>
                      {guestNameOf(selected)}
                    </Text>
                    <Text style={styles.summaryMeta} numberOfLines={1}>
                      {selected.guest?.phoneNumber || selected.guest?.email || '—'}
                    </Text>
                  </View>
                  <View style={styles.summaryCol}>
                    <Text style={styles.summaryLabel}>Property</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>
                      {selected.listing?.title || 'Property'}
                    </Text>
                    <Text style={styles.summaryMeta} numberOfLines={1}>
                      {[selected.listing?.area, selected.listing?.city].filter(Boolean).join(', ') ||
                        '—'}
                    </Text>
                  </View>
                  <View style={styles.summaryCol}>
                    <Text style={styles.summaryLabel}>Stay</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>
                      {formatRange(selected.checkInDate, selected.checkOutDate)}
                    </Text>
                    <Text style={styles.summaryMeta}>
                      {nightsBetween(
                        selected.checkInDate,
                        selected.checkOutDate,
                        selected.nightCount,
                      )}{' '}
                      nights
                    </Text>
                  </View>
                </View>

                <View style={styles.sheetHealth}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.healthLabel}>Booking Health</Text>
                    <Text style={styles.healthValue}>{selectedHealth.label}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${selectedHealth.percent}%`,
                            backgroundColor: healthColor(selectedHealth.tone),
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.paymentBox}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={styles.paymentTitle}>Paid in Full</Text>
                    <Text style={styles.paymentAmount}>{amountLabel(selected.totalPrice)}</Text>
                  </View>
                </View>

                <View style={styles.sheetActions}>
                  <NativeButton
                    label="Message"
                    variant="primary"
                    style={styles.sheetBtn}
                    onPress={() => messageGuest(selected)}
                  />
                  <NativeButton
                    label="Record Payment"
                    variant="secondary"
                    style={styles.sheetBtn}
                    onPress={() => Alert.alert('Record Payment', 'Payment recording is coming soon.')}
                  />
                  <NativeButton
                    label="More Actions"
                    variant="ghost"
                    style={styles.sheetBtn}
                    onPress={() =>
                      Alert.alert('More Actions', undefined, [
                        { text: 'Edit Booking', onPress: () => Alert.alert('Edit Booking', 'Coming soon.') },
                        { text: 'Check In', onPress: () => Alert.alert('Check In', 'Coming soon.') },
                        { text: 'Check Out', onPress: () => Alert.alert('Check Out', 'Coming soon.') },
                        { text: 'Duplicate', onPress: () => Alert.alert('Duplicate', 'Coming soon.') },
                        {
                          text: 'Cancel Booking',
                          style: 'destructive',
                          onPress: () => Alert.alert('Cancel Booking', 'Coming soon.'),
                        },
                        { text: 'Generate Invoice', onPress: () => Alert.alert('Invoice', 'Coming soon.') },
                        { text: 'Close', style: 'cancel' },
                      ])
                    }
                  />
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function ScrollFilters({
  onProperty,
  onStatus,
  onDate,
  onFilter,
}: {
  onProperty: () => void;
  onStatus: () => void;
  onDate: () => void;
  onFilter: () => void;
}) {
  const pills: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Property', onPress: onProperty, icon: 'home-outline' },
    { label: 'Status', onPress: onStatus, icon: 'flag-outline' },
    { label: 'Date', onPress: onDate, icon: 'calendar-outline' },
    { label: 'Filter', onPress: onFilter, icon: 'options-outline' },
  ];
  return (
    <View style={styles.filtersRow}>
      {pills.map((p) => (
        <Pressable key={p.label} style={styles.filterPill} onPress={p.onPress}>
          {p.icon ? <Ionicons name={p.icon} size={14} color={colors.textSecondary} /> : null}
          <Text style={styles.filterText}>{p.label}</Text>
          <Ionicons name="chevron-down" size={12} color={colors.textTertiary} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabsWrap: { paddingBottom: spacing.sm },
  tabsContent: { paddingHorizontal: spacing.md, gap: spacing.sm },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: '#F4F4F5',
  },
  tabActive: { backgroundColor: colors.primaryDark },
  tabText: { ...typography.footnote, fontWeight: '700', color: colors.textSecondary },
  tabTextActive: { color: '#fff' },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterText: { ...typography.caption, fontWeight: '600', color: colors.text },
  searchWrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    borderRadius: radii.md,
    backgroundColor: '#F4F4F5',
  },
  searchInput: { flex: 1, ...typography.subhead, color: colors.text, paddingVertical: 10 },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: 100, gap: spacing.md },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyTitle: { ...typography.headline, color: colors.text },
  emptyBody: { ...typography.subhead, color: colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardTop: { gap: spacing.sm },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.border },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  avatarLetter: { ...typography.footnote, fontWeight: '700', color: colors.primaryDark },
  guestName: { ...typography.subhead, fontWeight: '700', color: colors.text },
  guestMeta: { ...typography.caption, color: colors.textSecondary },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  statusPillText: { ...typography.caption, fontWeight: '700' },
  propertyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  thumb: { width: 44, height: 44, borderRadius: radii.sm, backgroundColor: colors.border },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  propertyTitle: { ...typography.subhead, fontWeight: '600', color: colors.text },
  propertyMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
  },
  channelText: { ...typography.caption, fontWeight: '700', color: colors.primaryDark },
  amount: { ...typography.subhead, fontWeight: '700', color: colors.text },
  healthBlock: { gap: 6 },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  healthRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthValue: { ...typography.footnote, fontWeight: '700', color: colors.text },
  opPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  opPillText: { ...typography.caption, fontWeight: '700' },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F4F4F5',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  percentText: { ...typography.caption, color: colors.textTertiary, alignSelf: 'flex-end' },
  timeline: { flexDirection: 'row', marginTop: spacing.xs },
  timelineStep: { flex: 1, alignItems: 'center', gap: 4 },
  timelineNodeRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  timelineLine: { flex: 1, height: 2, backgroundColor: colors.border },
  timelineLineDone: { backgroundColor: colors.primary },
  timelineLineSpacer: { flex: 1 },
  timelineNode: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodeDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timelineNodeCurrent: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  timelineLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  fabMenu: {
    position: 'absolute',
    right: spacing.md,
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm,
    gap: 2,
  },
  fabSection: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.sm,
    paddingTop: 4,
  },
  fabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radii.sm,
  },
  fabRowLabel: { ...typography.subhead, color: colors.text, fontWeight: '600' },
  fabCancel: {
    marginTop: spacing.xs,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  fabCancelText: { ...typography.subhead, fontWeight: '700', color: colors.error },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
    maxHeight: '88%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sheetTitle: { ...typography.headline, color: colors.text },
  sheetRef: { ...typography.footnote, color: colors.textSecondary, marginTop: 2 },
  summaryGrid: { flexDirection: 'row', gap: spacing.sm },
  summaryCol: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: 2,
  },
  summaryLabel: { ...typography.caption, color: colors.textTertiary, fontWeight: '600' },
  summaryValue: { ...typography.footnote, fontWeight: '700', color: colors.text },
  summaryMeta: { ...typography.caption, color: colors.textSecondary },
  sheetHealth: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  paymentBox: {
    width: 120,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  paymentTitle: { ...typography.caption, fontWeight: '700', color: colors.primaryDark },
  paymentAmount: { ...typography.footnote, fontWeight: '700', color: colors.text },
  sheetActions: { gap: spacing.sm },
  sheetBtn: { minHeight: 46 },
});
