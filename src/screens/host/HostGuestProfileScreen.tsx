import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api, useAuth } from '@/shared/context/AuthContext';
import { normalizePaginated } from '@/shared/utils/pagination';
import type { HostReservation } from '@/shared/types/host';
import type { RootStackParamList } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'HostGuestProfile'>;

type GuestProfile = {
  name: string;
  avatarUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  totalStays: number;
  totalSpend: string;
  avgRating: number;
  tags: string[];
  verified: boolean;
  activeBooking?: HostReservation | null;
  recentReservations: HostReservation[];
};

export function HostGuestProfileScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { guestKey, guestName } = route.params;

  const [reservations, setReservations] = useState<HostReservation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [page1, page2] = await Promise.all([
        api.get('/reservations/host/me', { params: { page: 1, limit: 50 } }),
        api.get('/reservations/host/me', { params: { page: 2, limit: 50 } }).catch(() => ({ data: [] })),
      ]);

      const data1 = normalizePaginated<HostReservation>(page1.data);
      const data2 = normalizePaginated<HostReservation>(page2.data);

      const allReservations = [...data1.items, ...data2.items];

      // Filter reservations for this guest
      const guestReservations = allReservations.filter((r) => {
        const rGuestId = r.guest?.id || r.guest?.email || 'unknown';
        return rGuestId === guestKey;
      });

      setReservations(guestReservations);
    } catch {
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [token, guestKey]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const profile: GuestProfile = useMemo(() => {
    const firstRes = reservations[0];
    const name = firstRes?.guest?.fullName || guestName || 'Guest';
    const avatarUrl = firstRes?.guest?.avatarUrl;
    const email = firstRes?.guest?.email;
    const phone = firstRes?.guest?.phoneNumber;

    const totalStays = reservations.length;
    const totalSpend = reservations.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);
    const avgRating = 4.8;

    const tags: string[] = [];
    if (totalStays >= 3) tags.push('Returning');
    if (totalStays >= 5) tags.push('VIP');

    const activeBooking = reservations.find((r) => {
      const status = String(r.status ?? '').toLowerCase();
      return status === 'confirmed' || status === 'active';
    });

    return {
      name,
      avatarUrl,
      email,
      phone,
      totalStays,
      totalSpend: `$${totalSpend.toLocaleString()}`,
      avgRating,
      tags,
      verified: true,
      activeBooking,
      recentReservations: reservations.slice(0, 5),
    };
  }, [reservations, guestName]);

  const handleMessage = () => {
    if (profile.activeBooking?.id) {
      navigation.navigate('ChatThread', {
        conversationId: profile.activeBooking.id,
        kind: 'reservation',
        title: profile.name,
        subtitle: profile.activeBooking.listing?.title,
        role: 'host',
      });
    } else {
      Alert.alert('Message', 'Messaging requires an active booking.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Guest Profile</Text>
        <Pressable hitSlop={8} onPress={() => Alert.alert('Options', 'Guest options coming soon.')}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarLetter}>{profile.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.summaryInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{profile.name}</Text>
                {profile.verified && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
              </View>
              {profile.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {profile.tags.map((tag) => (
                    <View key={tag} style={styles.badge}>
                      <Text style={styles.badgeText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
              {profile.email ? <Text style={styles.contact}>{profile.email}</Text> : null}
              {profile.phone ? <Text style={styles.contact}>{profile.phone}</Text> : null}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.totalStays}</Text>
              <Text style={styles.statLabel}>Stays</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.totalSpend}</Text>
              <Text style={styles.statLabel}>Spend</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.avgRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Current Booking */}
        {profile.activeBooking ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Booking</Text>
            <View style={styles.bookingCard}>
              <View style={styles.bookingRow}>
                <Ionicons name="home" size={20} color={colors.primaryDark} />
                <Text style={styles.bookingTitle}>{profile.activeBooking.listing?.title || 'Listing'}</Text>
              </View>
              <Text style={styles.bookingDates}>
                {new Date(profile.activeBooking.checkInDate).toLocaleDateString()} -{' '}
                {new Date(profile.activeBooking.checkOutDate).toLocaleDateString()}
              </Text>
              <Text style={styles.bookingRef}>
                Ref: {profile.activeBooking.bookingRef || profile.activeBooking.referenceCode || profile.activeBooking.id}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Preferences stub */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.chipsRow}>
            <View style={styles.prefChip}>
              <Text style={styles.prefChipText}>Non-smoking</Text>
            </View>
            <View style={styles.prefChip}>
              <Text style={styles.prefChipText}>Early check-in</Text>
            </View>
            <Pressable
              style={styles.addBtn}
              onPress={() => Alert.alert('Add Preference', 'Guest preferences coming soon.')}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primaryDark} />
              <Text style={styles.addText}>Add</Text>
            </Pressable>
          </View>
        </View>

        {/* Activity Timeline stub */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Timeline</Text>
          {profile.recentReservations.slice(0, 3).map((r) => (
            <View key={r.id} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineBody}>
                <Text style={styles.timelineTitle}>
                  {String(r.status ?? 'Booking').charAt(0).toUpperCase() + String(r.status ?? 'Booking').slice(1)}
                </Text>
                <Text style={styles.timelineSubtitle}>
                  {r.listing?.title} • {new Date(r.checkInDate).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
          {profile.recentReservations.length === 0 && (
            <Text style={styles.emptyText}>No activity yet</Text>
          )}
        </View>

        {/* Internal Notes stub */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Internal Notes</Text>
          <Pressable
            style={styles.notesPlaceholder}
            onPress={() => Alert.alert('Internal Notes', 'Notes feature coming soon.')}
          >
            <Ionicons name="document-text-outline" size={24} color={colors.textTertiary} />
            <Text style={styles.notesPlaceholderText}>Add internal notes about this guest</Text>
          </Pressable>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <Pressable style={styles.actionBtn} onPress={handleMessage}>
              <Ionicons name="chatbubbles-outline" size={24} color={colors.primaryDark} />
              <Text style={styles.actionText}>Message</Text>
            </Pressable>
            <Pressable
              style={styles.actionBtn}
              onPress={() => Alert.alert('Request Review', 'Review requests coming soon.')}
            >
              <Ionicons name="star-outline" size={24} color={colors.primaryDark} />
              <Text style={styles.actionText}>Request Review</Text>
            </Pressable>
            <Pressable
              style={styles.actionBtn}
              onPress={() => Alert.alert('Send Info', 'Sending info coming soon.')}
            >
              <Ionicons name="information-circle-outline" size={24} color={colors.primaryDark} />
              <Text style={styles.actionText}>Send Info</Text>
            </Pressable>
            <Pressable
              style={styles.actionBtn}
              onPress={() => Alert.alert('View Bookings', 'Viewing all guest bookings coming soon.')}
            >
              <Ionicons name="calendar-outline" size={24} color={colors.primaryDark} />
              <Text style={styles.actionText}>View Bookings</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
  scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  summaryTop: { flexDirection: 'row', gap: spacing.md },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.border },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryMuted },
  avatarLetter: { ...typography.title2, color: colors.primaryDark },
  summaryInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { ...typography.title3, color: colors.text },
  tagsRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  badge: { backgroundColor: colors.primaryMuted, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },
  contact: { ...typography.footnote, color: colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, backgroundColor: colors.primarySoft, borderRadius: radii.md },
  statValue: { ...typography.title3, color: colors.text, fontWeight: '700' },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.headline, color: colors.text, marginBottom: spacing.sm },
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 4,
  },
  bookingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bookingTitle: { ...typography.headline, color: colors.text },
  bookingDates: { ...typography.subhead, color: colors.textSecondary },
  bookingRef: { ...typography.caption, color: colors.textTertiary },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  prefChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.primaryMuted,
  },
  prefChipText: { ...typography.footnote, color: colors.primaryDark },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  addText: { ...typography.footnote, fontWeight: '600', color: colors.primaryDark },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 4 },
  timelineBody: { flex: 1 },
  timelineTitle: { ...typography.subhead, color: colors.text, fontWeight: '600' },
  timelineSubtitle: { ...typography.caption, color: colors.textSecondary },
  emptyText: { ...typography.subhead, color: colors.textTertiary, textAlign: 'center', paddingVertical: spacing.md },
  notesPlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  notesPlaceholderText: { ...typography.subhead, color: colors.textSecondary },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionBtn: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    gap: 4,
  },
  actionText: { ...typography.caption, color: colors.text, fontWeight: '600', textAlign: 'center' },
});
