import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { api, useAuth } from '@/shared/context/AuthContext';
import { normalizePaginated } from '@/shared/utils/pagination';
import type { Booking } from '@/shared/types/listing';
import { colors, radii, spacing, typography } from '@/theme';

export function TripsScreen() {
  const { token } = useAuth();
  const [trips, setTrips] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!token) return;
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
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!token) {
    return (
      <NativeScreen scroll={false} style={styles.centered}>
        <Text style={styles.emptyTitle}>Sign in to see your trips</Text>
      </NativeScreen>
    );
  }

  return (
    <NativeScreen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : trips.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyBody}>Book a stay from Explore to see it here.</Text>
        </View>
      ) : (
        trips.map((trip) => (
          <View key={trip.id} style={styles.card}>
            <Text style={styles.cardTitle}>{trip.listing?.title ?? 'Stay'}</Text>
            <Text style={styles.cardMeta}>
              {trip.checkInDate} → {trip.checkOutDate}
            </Text>
            <Text style={styles.status}>{trip.status}</Text>
          </View>
        ))
      )}
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: { marginTop: spacing.xl },
  empty: { paddingTop: spacing.xl, gap: spacing.sm },
  emptyTitle: { ...typography.title3, color: colors.text },
  emptyBody: { ...typography.body, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 6,
  },
  cardTitle: { ...typography.headline, color: colors.text },
  cardMeta: { ...typography.subhead, color: colors.textSecondary },
  status: { ...typography.footnote, color: colors.primary, fontWeight: '600', textTransform: 'capitalize' },
});
