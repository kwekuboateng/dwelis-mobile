import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, useAuth } from '@/shared/context/AuthContext';
import { normalizePaginated } from '@/shared/utils/pagination';
import type { HostReservation } from '@/shared/types/host';
import type { RootStackParamList } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type GuestFilter = 'All' | 'Currently Staying' | 'Arriving Soon' | 'Checked Out' | 'Returning' | 'VIP' | 'Outstanding';

type GuestCard = {
  guestKey: string;
  guestName: string;
  avatarUrl?: string | null;
  propertyTitle?: string;
  status: string;
  lastStay?: string;
  lifetimeStays: number;
  lifetimeSpend: string;
  lifetimeRating: number;
  tags: string[];
};

function extractGuests(reservations: HostReservation[]): GuestCard[] {
  const guestMap = new Map<string, GuestCard>();

  reservations.forEach((r) => {
    const guestId = r.guest?.id || r.guest?.email || 'unknown';
    const guestName = r.guest?.fullName || 'Guest';
    const avatarUrl = r.guest?.avatarUrl;
    const status = String(r.status ?? 'unknown').toLowerCase();

    if (!guestMap.has(guestId)) {
      guestMap.set(guestId, {
        guestKey: guestId,
        guestName,
        avatarUrl,
        propertyTitle: r.listing?.title,
        status,
        lastStay: r.checkOutDate,
        lifetimeStays: 0,
        lifetimeSpend: '$0',
        lifetimeRating: 4.8,
        tags: [],
      });
    }

    const guest = guestMap.get(guestId)!;
    guest.lifetimeStays += 1;

    if (status === 'confirmed' || status === 'active') {
      guest.status = 'Currently Staying';
      guest.propertyTitle = r.listing?.title;
    } else if (status === 'upcoming') {
      guest.status = 'Arriving Soon';
    }

    const checkOutDate = new Date(r.checkOutDate);
    const lastStayDate = guest.lastStay ? new Date(guest.lastStay) : null;
    if (!lastStayDate || checkOutDate > lastStayDate) {
      guest.lastStay = r.checkOutDate;
    }

    // Mock spend
    const totalPrice = Number(r.totalPrice) || 0;
    const currentSpend = Number(guest.lifetimeSpend.replace('$', '').replace(',', '')) || 0;
    guest.lifetimeSpend = `$${(currentSpend + totalPrice).toLocaleString()}`;

    // Tags
    if (guest.lifetimeStays >= 3 && !guest.tags.includes('Returning')) {
      guest.tags.push('Returning');
    }
    if (guest.lifetimeStays >= 5 && !guest.tags.includes('VIP')) {
      guest.tags.push('VIP');
    }
  });

  return Array.from(guestMap.values()).sort((a, b) => {
    const aDate = a.lastStay ? new Date(a.lastStay).getTime() : 0;
    const bDate = b.lastStay ? new Date(b.lastStay).getTime() : 0;
    return bDate - aDate;
  });
}

export function HostGuestsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [reservations, setReservations] = useState<HostReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<GuestFilter>('All');

  const load = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        // Load multiple pages to get more unique guests
        const [page1, page2, page3] = await Promise.all([
          api.get('/reservations/host/me', { params: { page: 1, limit: 50 } }),
          api.get('/reservations/host/me', { params: { page: 2, limit: 50 } }).catch(() => ({ data: [] })),
          api.get('/reservations/host/me', { params: { page: 3, limit: 50 } }).catch(() => ({ data: [] })),
        ]);

        const data1 = normalizePaginated<HostReservation>(page1.data);
        const data2 = normalizePaginated<HostReservation>(page2.data);
        const data3 = normalizePaginated<HostReservation>(page3.data);

        setReservations([...data1.items, ...data2.items, ...data3.items]);
      } catch {
        setReservations([]);
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

  const guests = useMemo(() => extractGuests(reservations), [reservations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests.filter((g) => {
      if (filter === 'Currently Staying' && g.status !== 'Currently Staying') return false;
      if (filter === 'Arriving Soon' && g.status !== 'Arriving Soon') return false;
      if (filter === 'Checked Out' && g.status !== 'Checked Out' && g.status !== 'completed') return false;
      if (filter === 'Returning' && !g.tags.includes('Returning')) return false;
      if (filter === 'VIP' && !g.tags.includes('VIP')) return false;
      if (filter === 'Outstanding' && g.tags.includes('VIP')) return false;

      if (!q) return true;
      return (
        g.guestName.toLowerCase().includes(q) ||
        (g.propertyTitle ?? '').toLowerCase().includes(q)
      );
    });
  }, [guests, query, filter]);

  const stats = useMemo(() => {
    return {
      total: guests.length,
      currentlyStaying: guests.filter((g) => g.status === 'Currently Staying').length,
      returning: guests.filter((g) => g.tags.includes('Returning')).length,
      vip: guests.filter((g) => g.tags.includes('VIP')).length,
    };
  }, [guests]);

  const filters: GuestFilter[] = [
    'All',
    'Currently Staying',
    'Arriving Soon',
    'Checked Out',
    'Returning',
    'VIP',
    'Outstanding',
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Guests</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter chips */}
      <View style={styles.filtersRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={(f) => f}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => {
            const active = filter === item;
            return (
              <Pressable
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(item)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or property"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Guests</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.currentlyStaying}</Text>
            <Text style={styles.statLabel}>Staying</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.returning}</Text>
            <Text style={styles.statLabel}>Returning</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.vip}</Text>
            <Text style={styles.statLabel}>VIP</Text>
          </View>
        </View>
      </View>

      {/* Guest list */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.guestKey}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No guests</Text>
              <Text style={styles.emptyBody}>Guests from your reservations will appear here.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate('HostGuestProfile', { guestKey: item.guestKey, guestName: item.guestName })
              }
            >
              <View style={styles.cardLeft}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarLetter}>{item.guestName.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardName}>{item.guestName}</Text>
                  {item.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {item.tags.slice(0, 2).map((tag) => (
                        <View key={tag} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                {item.propertyTitle ? (
                  <Text style={styles.cardProperty} numberOfLines={1}>
                    {item.propertyTitle}
                  </Text>
                ) : null}
                <Text style={styles.cardStatus}>{item.status}</Text>
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Last stay:</Text>
                    <Text style={styles.metaValue}>
                      {item.lastStay ? new Date(item.lastStay).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Stays:</Text>
                    <Text style={styles.metaValue}>{item.lifetimeStays}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Spend:</Text>
                    <Text style={styles.metaValue}>{item.lifetimeSpend}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Rating:</Text>
                    <Text style={styles.metaValue}>{item.lifetimeRating.toFixed(1)}</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </Pressable>
          )}
        />
      )}

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => Alert.alert('Add Guest', 'Creating direct bookings coming soon.')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  headerTitle: { ...typography.title2, color: colors.text, flex: 1, textAlign: 'center' },
  filtersRow: { marginBottom: spacing.sm },
  filtersList: { paddingHorizontal: spacing.md, gap: spacing.sm },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.footnote, fontWeight: '700', color: colors.textSecondary },
  filterTextActive: { color: '#fff' },
  searchRow: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F4F4F5',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  searchInput: { flex: 1, ...typography.subhead, color: colors.text, paddingVertical: 10 },
  statsCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.title3, color: colors.text, fontWeight: '700' },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  list: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl * 2,
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.title3, color: colors.text },
  emptyBody: { ...typography.subhead, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardLeft: {},
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.border },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryMuted },
  avatarLetter: { ...typography.headline, color: colors.primaryDark },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 },
  cardName: { ...typography.headline, color: colors.text, flex: 1 },
  tagsRow: { flexDirection: 'row', gap: 4 },
  tag: { backgroundColor: colors.primaryMuted, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },
  cardProperty: { ...typography.footnote, color: colors.textSecondary, marginBottom: 2 },
  cardStatus: { ...typography.caption, color: colors.textTertiary, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaItem: { flexDirection: 'row', gap: 2 },
  metaLabel: { ...typography.caption, color: colors.textSecondary },
  metaValue: { ...typography.caption, color: colors.text, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
