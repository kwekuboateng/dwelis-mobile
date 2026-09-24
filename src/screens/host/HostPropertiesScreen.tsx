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
import type { HostListing } from '@/shared/types/host';
import { coverUrl, mockHealth } from '@/shared/types/host';
import type { RootStackParamList } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type StatusFilter = 'All' | 'Active' | 'Draft' | 'Needs Attention' | 'Cleaning' | 'Maintenance' | 'Archived';

function getStatusPill(listing: HostListing): { label: string; bg: string; fg: string } {
  const status = String(listing.status ?? 'draft').toLowerCase();
  if (status === 'active') return { label: 'Active', bg: colors.primaryMuted, fg: colors.primaryDark };
  if (status === 'archived') return { label: 'Archived', bg: '#F4F4F5', fg: colors.textTertiary };
  return { label: 'Draft', bg: '#FEF3C7', fg: '#92400E' };
}

export function HostPropertiesScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [listings, setListings] = useState<HostListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const load = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setListings([]);
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await api.get('/listings/hosts/me', {
          params: { page: 1, limit: 100 },
        });
        const data = normalizePaginated<HostListing>(res.data);
        setListings(data.items);
      } catch {
        setListings([]);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      const status = String(l.status ?? 'draft').toLowerCase();
      const health = mockHealth(l.id);

      // Status filter
      if (statusFilter === 'Active' && status !== 'active') return false;
      if (statusFilter === 'Draft' && status !== 'draft') return false;
      if (statusFilter === 'Archived' && status !== 'archived') return false;
      if (statusFilter === 'Needs Attention' && health.tone !== 'bad') return false;
      if (statusFilter === 'Cleaning' && health.percent >= 75) return false;
      if (statusFilter === 'Maintenance' && health.percent >= 75) return false;

      // Search
      if (!q) return true;
      return (
        l.title?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.area?.toLowerCase().includes(q) ||
        l.address?.toLowerCase().includes(q)
      );
    });
  }, [listings, query, statusFilter]);

  const stats = useMemo(() => {
    const active = listings.filter((l) => String(l.status ?? '').toLowerCase() === 'active').length;
    const needsAttention = listings.filter((l) => mockHealth(l.id).tone === 'bad').length;
    return {
      total: listings.length,
      active,
      needsAttention,
      avgOccupancy: 72,
      revenue: '$12.4k',
    };
  }, [listings]);

  const statusFilters: StatusFilter[] = [
    'All',
    'Active',
    'Draft',
    'Needs Attention',
    'Cleaning',
    'Maintenance',
    'Archived',
  ];

  const handleImport = () => {
    Alert.alert('Import Listing', 'Importing listings from other platforms coming soon.');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Properties</Text>
        <Pressable onPress={() => navigation.navigate('HostEditProperty', undefined)} hitSlop={8}>
          <Ionicons name="add-outline" size={28} color={colors.primaryDark} />
        </Pressable>
      </View>

      {/* Status filters */}
      <View style={styles.filtersRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusFilters}
          keyExtractor={(f) => f}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => {
            const active = statusFilter === item;
            return (
              <Pressable
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatusFilter(item)}
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
            placeholder="Search properties"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Summary stats */}
      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, stats.needsAttention > 0 && { color: colors.error }]}>
              {stats.needsAttention}
            </Text>
            <Text style={styles.statLabel}>Needs Attention</Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.avgOccupancy}%</Text>
            <Text style={styles.statLabel}>Avg Occupancy</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.revenue}</Text>
            <Text style={styles.statLabel}>Revenue (mock)</Text>
          </View>
          <View style={styles.stat} />
        </View>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No properties</Text>
              <Text style={styles.emptyBody}>Add your first property to get started.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const img = coverUrl(item);
            const pill = getStatusPill(item);
            const health = mockHealth(item.id);
            const readiness = mockHealth(item.id + 'readiness');
            const cleaning = mockHealth(item.id + 'cleaning');
            const maintenance = mockHealth(item.id + 'maintenance');
            const quality = mockHealth(item.id + 'quality');

            return (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate('HostEditProperty', { id: item.id })}
              >
                {img ? (
                  <Image source={{ uri: img }} style={styles.cardImage} contentFit="cover" />
                ) : (
                  <View style={[styles.cardImage, styles.cardImageFallback]}>
                    <Ionicons name="home-outline" size={32} color={colors.textTertiary} />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                      <Text style={[styles.statusPillText, { color: pill.fg }]}>{pill.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardLocation} numberOfLines={1}>
                    {[item.area, item.city].filter(Boolean).join(', ') || 'Location'}
                  </Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardMetaText}>
                      {item.bedsCount ?? 0} beds • {item.bathroomCount ?? 0} baths • {item.guestsCount ?? 0}{' '}
                      guests
                    </Text>
                  </View>
                  <View style={styles.cardMetrics}>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Occupancy</Text>
                      <Text style={styles.metricValue}>{health.percent}%</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Readiness</Text>
                      <Text style={styles.metricValue}>{readiness.label}</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Revenue</Text>
                      <Text style={styles.metricValue}>$2.1k</Text>
                    </View>
                  </View>
                  <View style={styles.bars}>
                    <ProgressBar label="Readiness" percent={readiness.percent} tone={readiness.tone} />
                    <ProgressBar label="Cleaning" percent={cleaning.percent} tone={cleaning.tone} />
                    <ProgressBar label="Maintenance" percent={maintenance.percent} tone={maintenance.tone} />
                    <ProgressBar label="Quality" percent={quality.percent} tone={quality.tone} />
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* FAB */}
      <View style={styles.fabRow}>
        <Pressable style={styles.fabSecondary} onPress={handleImport}>
          <Ionicons name="download-outline" size={20} color={colors.primaryDark} />
          <Text style={styles.fabSecondaryText}>Import</Text>
        </Pressable>
        <Pressable
          style={styles.fab}
          onPress={() => navigation.navigate('HostEditProperty', undefined)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.fabText}>New Property</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProgressBar({
  label,
  percent,
  tone,
}: {
  label: string;
  percent: number;
  tone: 'good' | 'warn' | 'bad';
}) {
  const barColor = tone === 'good' ? colors.success : tone === 'warn' ? '#F59E0B' : colors.error;
  return (
    <View style={barStyles.root}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${percent}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={barStyles.value}>{percent}%</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  label: { ...typography.caption, color: colors.textSecondary, width: 72 },
  track: { flex: 1, height: 6, backgroundColor: '#F4F4F5', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%' },
  value: { ...typography.caption, color: colors.text, fontWeight: '600', width: 32, textAlign: 'right' },
});

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
    gap: spacing.sm,
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
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardImage: { width: 120, height: 160, backgroundColor: colors.border },
  cardImageFallback: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, padding: spacing.md, gap: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 },
  cardTitle: { ...typography.headline, color: colors.text, flex: 1 },
  statusPill: { borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 2 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  cardLocation: { ...typography.footnote, color: colors.textSecondary, marginBottom: 2 },
  cardMeta: { marginBottom: spacing.sm },
  cardMetaText: { ...typography.caption, color: colors.textTertiary },
  cardMetrics: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  metric: { flex: 1 },
  metricLabel: { ...typography.caption, color: colors.textSecondary },
  metricValue: { ...typography.footnote, color: colors.text, fontWeight: '600' },
  bars: { gap: 2 },
  fabRow: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fabSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.primaryMuted,
  },
  fabSecondaryText: { ...typography.footnote, fontWeight: '700', color: colors.primaryDark },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.primaryDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: { ...typography.footnote, fontWeight: '700', color: '#fff' },
});
