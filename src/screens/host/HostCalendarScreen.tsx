import React, { useCallback, useState, useMemo } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { HostHeader } from '@/components/host/HostHeader';
import { api, useAuth } from '@/shared/context/AuthContext';
import { normalizePaginated } from '@/shared/utils/pagination';
import type { HostListing, TodayBookingItem } from '@/shared/types/host';
import { colors, radii, spacing, typography } from '@/theme';

type CalendarDay = {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasEvents: boolean;
  eventDot?: string; // color
};

type CalendarEvent = {
  id: string;
  date: string;
  checkIn?: boolean;
  checkOut?: boolean;
  guestName?: string;
  listingId?: string;
  status?: string;
};

type ViewMode = 'Month' | 'Week' | 'Day' | 'Agenda';

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const days: Date[] = [];

  // Previous month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  // Next month padding
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push(new Date(year, month + 1, d));
  }

  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function HostCalendarScreen() {
  const { token } = useAuth();
  const [listings, setListings] = useState<HostListing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [todayBookings, setTodayBookings] = useState<TodayBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [listingsRes, todayRes] = await Promise.all([
        api.get('/listings/hosts/me', { params: { page: 1, limit: 50 } }),
        api.get('/bookings/today').catch(() => ({ data: [] })),
      ]);

      const listingsData = normalizePaginated<HostListing>(listingsRes.data);
      setListings(listingsData.items);

      const todayData = Array.isArray(todayRes.data) ? todayRes.data : [];
      setTodayBookings(
        todayData
          .filter((item: unknown): item is TodayBookingItem => {
            const b = item as Record<string, unknown> | null;
            return Boolean(b?.id);
          })
          .slice(0, 5),
      );

      // Load calendar events if a specific listing is selected
      if (selectedListingId && selectedListingId !== 'all' && listingsData.items.length > 0) {
        const listingId = selectedListingId === 'first' ? listingsData.items[0]?.id : selectedListingId;
        if (listingId) {
          try {
            const calRes = await api.get(`/calendar/bookings/${listingId}`, {
              params: {
                startDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
                  .toISOString()
                  .split('T')[0],
                endDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
                  .toISOString()
                  .split('T')[0],
              },
            });
            const rawEvents = Array.isArray(calRes.data) ? calRes.data : calRes.data?.items ?? [];
            setEvents(
              rawEvents.map((e: Record<string, unknown>) => ({
                id: String(e.id ?? e.bookingId ?? Math.random()),
                date: String(e.date ?? e.checkInDate ?? ''),
                checkIn: Boolean(e.checkIn || e.type === 'check_in'),
                checkOut: Boolean(e.checkOut || e.type === 'check_out'),
                guestName: String((e.guest as { fullName?: string } | undefined)?.fullName ?? e.guestName ?? ''),
                listingId: String(e.listingId ?? ''),
                status: String(e.status ?? ''),
              })),
            );
          } catch {
            setEvents([]);
          }
        }
      } else {
        setEvents([]);
      }
    } catch {
      setListings([]);
      setTodayBookings([]);
    } finally {
      setLoading(false);
    }
  }, [token, selectedListingId, currentMonth]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const changeMonth = (delta: number) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    if (mode !== 'Month') {
      Alert.alert('Coming Soon', `${mode} view will be available in a later version.`);
    } else {
      setViewMode(mode);
    }
  };

  const days = useMemo(() => {
    const today = new Date();
    const allDays = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const eventsByDate = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      const key = e.date.split('T')[0];
      if (!eventsByDate.has(key)) eventsByDate.set(key, []);
      eventsByDate.get(key)!.push(e);
    });

    return allDays.map((d): CalendarDay => {
      const key = dateKey(d);
      const dayEvents = eventsByDate.get(key) || [];
      return {
        date: d,
        dayOfMonth: d.getDate(),
        isCurrentMonth: d.getMonth() === currentMonth.getMonth(),
        isToday: isSameDay(d, today),
        isSelected: isSameDay(d, selectedDate),
        hasEvents: dayEvents.length > 0,
        eventDot: dayEvents.length > 0 ? colors.primary : undefined,
      };
    });
  }, [currentMonth, selectedDate, events]);

  const selectedDayEvents = useMemo(() => {
    const key = dateKey(selectedDate);
    return events.filter((e) => e.date.startsWith(key));
  }, [selectedDate, events]);

  // Mock stats (could derive from calendar bookings)
  const stats = useMemo(() => {
    const totalDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const bookedDays = events.filter((e) => e.checkIn).length;
    const occupancy = bookedDays > 0 ? Math.round((bookedDays / totalDays) * 100) : 0;
    return [
      { label: 'Available', value: totalDays - bookedDays, color: colors.success },
      { label: 'Occupied', value: bookedDays, color: colors.primary },
      { label: 'Blocked', value: 0, color: colors.textTertiary },
      { label: 'Occupancy', value: `${occupancy}%`, color: colors.primaryDark },
    ];
  }, [events, currentMonth]);

  const alerts = [
    { id: '1', icon: 'alert-circle', title: 'Upcoming check-in today', subtitle: '2 guests arriving' },
    { id: '2', icon: 'calendar', title: 'Low availability next month', subtitle: 'Consider adjusting pricing' },
  ];

  if (loading) {
    return (
      <View style={styles.root}>
        <HostHeader
          title="Calendar"
          rightSlot={
            <Pressable hitSlop={8} onPress={() => Alert.alert('Add', 'Add event coming soon.')}>
              <Ionicons name="add-outline" size={24} color={colors.text} />
            </Pressable>
          }
        />
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <HostHeader
        title="Calendar"
        rightSlot={
          <Pressable hitSlop={8} onPress={() => Alert.alert('Add', 'Add event coming soon.')}>
            <Ionicons name="add-outline" size={24} color={colors.text} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Month header + Today button */}
        <View style={styles.monthRow}>
          <View style={styles.monthLabel}>
            <Pressable onPress={() => changeMonth(-1)} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.monthText}>{formatMonthYear(currentMonth)}</Text>
            <Pressable onPress={() => changeMonth(1)} hitSlop={8}>
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </Pressable>
          </View>
          <Pressable style={styles.todayBtn} onPress={goToToday}>
            <Text style={styles.todayText}>Today</Text>
          </Pressable>
        </View>

        {/* View mode segmented control */}
        <View style={styles.segmented}>
          {(['Month', 'Week', 'Day', 'Agenda'] as ViewMode[]).map((mode) => {
            const active = viewMode === mode;
            return (
              <Pressable
                key={mode}
                style={[styles.segment, active && styles.segmentActive]}
                onPress={() => handleViewModeChange(mode)}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{mode}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Property picker */}
        <Pressable style={styles.pickerBtn} onPress={() => setShowPropertyPicker(!showPropertyPicker)}>
          <Text style={styles.pickerLabel}>
            {selectedListingId === 'all'
              ? 'All Properties'
              : listings.find((l) => l.id === selectedListingId)?.title || 'Select property'}
          </Text>
          <Ionicons
            name={showPropertyPicker ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
        {showPropertyPicker ? (
          <View style={styles.pickerDropdown}>
            <Pressable
              style={styles.pickerItem}
              onPress={() => {
                setSelectedListingId('all');
                setShowPropertyPicker(false);
              }}
            >
              <Text style={styles.pickerItemText}>All Properties</Text>
            </Pressable>
            {listings.map((l) => (
              <Pressable
                key={l.id}
                style={styles.pickerItem}
                onPress={() => {
                  setSelectedListingId(l.id);
                  setShowPropertyPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{l.title}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Stats */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          {stats.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Alerts */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.alertsRow}>
          {alerts.map((a) => (
            <View key={a.id} style={styles.alertCard}>
              <Ionicons name={a.icon as any} size={20} color={colors.primaryDark} />
              <View style={styles.alertBody}>
                <Text style={styles.alertTitle}>{a.title}</Text>
                <Text style={styles.alertSubtitle}>{a.subtitle}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Calendar grid */}
        <View style={styles.calendar}>
          <View style={styles.weekdayRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((wd) => (
              <View key={wd} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{wd}</Text>
              </View>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {days.map((day, i) => (
              <Pressable
                key={i}
                style={[
                  styles.dayCell,
                  day.isSelected && styles.dayCellSelected,
                  day.isToday && !day.isSelected && styles.dayCellToday,
                ]}
                onPress={() => setSelectedDate(day.date)}
              >
                <Text
                  style={[
                    styles.dayText,
                    !day.isCurrentMonth && styles.dayTextOtherMonth,
                    day.isSelected && styles.dayTextSelected,
                    day.isToday && !day.isSelected && styles.dayTextToday,
                  ]}
                >
                  {day.dayOfMonth}
                </Text>
                {day.hasEvents && day.eventDot ? (
                  <View style={[styles.dayDot, { backgroundColor: day.eventDot }]} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Day details */}
        {selectedDayEvents.length > 0 ? (
          <View style={styles.dayDetails}>
            <Text style={styles.dayDetailsTitle}>
              {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
            </Text>
            {selectedDayEvents.map((e) => (
              <View key={e.id} style={styles.eventRow}>
                <View style={[styles.eventDot, { backgroundColor: colors.primary }]} />
                <View style={styles.eventBody}>
                  <Text style={styles.eventText}>
                    {e.checkIn ? 'Check-in' : e.checkOut ? 'Check-out' : 'Event'}
                  </Text>
                  {e.guestName ? <Text style={styles.eventGuest}>{e.guestName}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Today's Operations */}
        {todayBookings.length > 0 ? (
          <View style={styles.todayOps}>
            <Text style={styles.sectionTitle}>Today's Operations</Text>
            {todayBookings.map((b) => (
              <View key={b.id} style={styles.opRow}>
                <Ionicons
                  name={b.type === 'check_in' ? 'log-in-outline' : 'log-out-outline'}
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.opBody}>
                  <Text style={styles.opTitle}>
                    {b.type === 'check_in' ? 'Check-in' : 'Check-out'} - {b.guest?.fullName || 'Guest'}
                  </Text>
                  <Text style={styles.opSubtitle}>{b.listing?.title || 'Listing'}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Filters FAB stub */}
        <Pressable style={styles.fab} onPress={() => Alert.alert('Filters', 'Calendar filters coming soon.')}>
          <Ionicons name="filter" size={24} color="#fff" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: 80 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  monthLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  monthText: { ...typography.title3, color: colors.text, minWidth: 180, textAlign: 'center' },
  todayBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMuted,
  },
  todayText: { ...typography.footnote, fontWeight: '700', color: colors.primaryDark },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F5',
    borderRadius: radii.md,
    padding: 2,
    marginBottom: spacing.md,
  },
  segment: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radii.sm },
  segmentActive: { backgroundColor: colors.surface },
  segmentText: { ...typography.footnote, fontWeight: '600', color: colors.textSecondary },
  segmentTextActive: { color: colors.text },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.sm,
  },
  pickerLabel: { ...typography.subhead, color: colors.text, fontWeight: '600' },
  pickerDropdown: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  pickerItem: { paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pickerItemText: { ...typography.subhead, color: colors.text },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  statCard: {
    minWidth: 100,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { ...typography.title3, fontWeight: '700' },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  alertsRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm, marginBottom: spacing.md },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 260,
  },
  alertBody: { flex: 1 },
  alertTitle: { ...typography.footnote, fontWeight: '600', color: colors.text },
  alertSubtitle: { ...typography.caption, color: colors.textSecondary },
  calendar: { marginBottom: spacing.md },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekdayCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  weekdayText: { ...typography.caption, fontWeight: '700', color: colors.textSecondary },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCellSelected: { backgroundColor: colors.primary, borderRadius: radii.sm },
  dayCellToday: { borderWidth: 1, borderColor: colors.primary, borderRadius: radii.sm },
  dayText: { ...typography.subhead, color: colors.text },
  dayTextOtherMonth: { color: colors.textTertiary },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
  dayTextToday: { color: colors.primary, fontWeight: '700' },
  dayDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2 },
  dayDetails: { marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radii.md },
  dayDetailsTitle: { ...typography.headline, color: colors.text, marginBottom: spacing.sm },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  eventDot: { width: 8, height: 8, borderRadius: 4 },
  eventBody: { flex: 1 },
  eventText: { ...typography.subhead, color: colors.text, fontWeight: '600' },
  eventGuest: { ...typography.caption, color: colors.textSecondary },
  todayOps: { marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radii.md },
  sectionTitle: { ...typography.headline, color: colors.text, marginBottom: spacing.sm },
  opRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  opBody: { flex: 1 },
  opTitle: { ...typography.subhead, color: colors.text, fontWeight: '600' },
  opSubtitle: { ...typography.caption, color: colors.textSecondary },
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
