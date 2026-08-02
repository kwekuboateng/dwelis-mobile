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
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ExploreHeader } from '@/components/explore/ExploreHeader';
import { api, useAuth } from '@/shared/context/AuthContext';
import type { GuestTabParamList, RootStackParamList } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<GuestTabParamList, 'Messages'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type ConversationTab = 'all' | 'bookings' | 'unread' | 'archived';

type Conversation = {
  id: string;
  kind: 'reservation' | 'inquiry';
  hostName: string;
  listingTitle: string;
  preview: string;
  unreadCount: number;
  updatedAt?: string | null;
  avatarUrl?: string | null;
  archived?: boolean;
  isSupport?: boolean;
};

function pickString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v;
  }
  return undefined;
}

function pickNumber(...values: unknown[]): number {
  for (const v of values) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function normalizeKind(raw: unknown): 'reservation' | 'inquiry' {
  const s = String(raw ?? '').toLowerCase();
  if (s.includes('inquiry') || s.includes('enquiry')) return 'inquiry';
  return 'reservation';
}

function extractConversations(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const d = data as Record<string, unknown> | null;
  if (!d) return [];
  for (const key of ['items', 'data', 'conversations', 'results']) {
    if (Array.isArray(d[key])) return d[key] as unknown[];
  }
  return [];
}

function normalizeConversation(raw: unknown): Conversation | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = pickString(r.id, r.conversationId, r.bookingId, r.inquiryId);
  if (!id) return null;

  const hostName =
    pickString(
      r.hostName,
      r.guestName,
      r.otherPartyName,
      r.counterpartName,
      (r.host as { fullName?: string } | undefined)?.fullName,
      (r.otherUser as { fullName?: string } | undefined)?.fullName,
    ) || 'Host';

  const listingTitle =
    pickString(
      r.listingTitle,
      r.title,
      (r.listing as { title?: string } | undefined)?.title,
    ) || 'Stay';

  const preview =
    pickString(
      r.lastMessage,
      r.preview,
      r.lastMessagePreview,
      r.message,
      (r.lastMessage as { content?: string } | undefined)?.content,
    ) || '';

  const avatarUrl =
    pickString(
      r.avatarUrl,
      r.listingImageUrl,
      r.imageUrl,
      (r.host as { avatarUrl?: string } | undefined)?.avatarUrl,
      (r.listing as { imageUrl?: string } | undefined)?.imageUrl,
    ) || null;

  const updatedAt =
    pickString(r.updatedAt, r.lastMessageAt, r.createdAt) || null;

  const unreadCount = pickNumber(r.unreadCount, r.unread, r.unreadMessages);
  const archived = Boolean(r.archived || r.isArchived || r.status === 'archived');
  const nameLower = hostName.toLowerCase();
  const isSupport = nameLower.includes('support') || nameLower.includes('dwelis');

  return {
    id,
    kind: normalizeKind(r.kind ?? r.type ?? r.conversationType),
    hostName,
    listingTitle,
    preview,
    unreadCount,
    updatedAt,
    avatarUrl,
    archived,
    isSupport,
  };
}

function formatRelativeTime(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function MessagesScreen() {
  const navigation = useNavigation<Nav>();
  const { token } = useAuth();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<ConversationTab>('all');

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
        const res = await api.get('/chat/conversations/guest', {
          params: { page: 1, limit: 30 },
        });
        const rawList = extractConversations(res.data);
        setItems(
          rawList
            .map(normalizeConversation)
            .filter((c): c is Conversation => Boolean(c)),
        );
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
    const unread = items.filter((c) => c.unreadCount > 0).length;
    return {
      all: items.length,
      unread,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((c) => {
      if (tab === 'bookings' && c.kind !== 'reservation') return false;
      if (tab === 'unread' && c.unreadCount <= 0) return false;
      if (tab === 'archived' && !c.archived) return false;
      if (tab !== 'archived' && c.archived) return false;
      if (!q) return true;
      return (
        c.hostName.toLowerCase().includes(q) ||
        c.listingTitle.toLowerCase().includes(q) ||
        c.preview.toLowerCase().includes(q)
      );
    });
  }, [items, query, tab]);

  const openThread = (c: Conversation) => {
    navigation.navigate('ChatThread', {
      conversationId: c.id,
      kind: c.kind,
      title: c.hostName,
      subtitle: c.listingTitle,
      hostName: c.hostName,
    });
  };

  const tabs: { key: ConversationTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: counts.all || undefined },
    { key: 'bookings', label: 'Bookings' },
    { key: 'unread', label: 'Unread', count: counts.unread || undefined },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <View style={styles.root}>
      <ExploreHeader onProfilePress={() => navigation.navigate('Profile')} />

      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Messages</Text>
          <Pressable
            hitSlop={8}
            onPress={() => Alert.alert('Compose', 'Starting a new conversation is coming soon.')}
          >
            <Ionicons name="create-outline" size={24} color={colors.text} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Stay connected with your hosts throughout your journey.</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search conversations"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
        <Pressable
          style={styles.filterBtn}
          onPress={() => Alert.alert('Filters', 'Conversation filters coming soon.')}
        >
          <Ionicons name="filter" size={18} color={colors.text} />
        </Pressable>
      </View>

      <ScrollPills tabs={tabs} active={tab} onChange={setTab} />

      {!token ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sign in to message hosts</Text>
          <Text style={styles.emptyBody}>Your conversations will appear here after you sign in.</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No conversations</Text>
              <Text style={styles.emptyBody}>
                When you message a host, your threads will show up here.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Pressable
              style={[styles.row, index === 0 && item.unreadCount > 0 && styles.rowHighlight]}
              onPress={() => openThread(item)}
            >
              {item.isSupport ? (
                <View style={[styles.thumb, styles.supportThumb]}>
                  <Ionicons name="headset" size={22} color={colors.primaryDark} />
                </View>
              ) : item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <Text style={styles.thumbLetter}>{item.hostName.charAt(0).toUpperCase()}</Text>
                </View>
              )}

              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.hostName}
                    </Text>
                    {!item.isSupport ? (
                      <View style={styles.hostPill}>
                        <Text style={styles.hostPillText}>Host</Text>
                      </View>
                    ) : (
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    )}
                  </View>
                  <Text style={styles.time}>{formatRelativeTime(item.updatedAt)}</Text>
                </View>
                <Text style={styles.listing} numberOfLines={1}>
                  {item.listingTitle}
                </Text>
                <View style={styles.previewRow}>
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.preview || 'No messages yet'}
                  </Text>
                  {item.unreadCount > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>
                        {item.unreadCount > 9 ? '9+' : item.unreadCount}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function ScrollPills({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: ConversationTab; label: string; count?: number }[];
  active: ConversationTab;
  onChange: (key: ConversationTab) => void;
}) {
  return (
    <View style={styles.pills}>
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[styles.pill, isActive && styles.pillActive]}
          >
            <Text style={[styles.pillLabel, isActive && styles.pillLabelActive]}>{t.label}</Text>
            {t.count != null && t.count > 0 ? (
              <View style={[styles.pillCount, isActive && styles.pillCountActive]}>
                <Text style={[styles.pillCountText, isActive && styles.pillCountTextActive]}>
                  {t.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  titleBlock: { paddingHorizontal: spacing.md, marginBottom: spacing.md, gap: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { ...typography.title1, color: colors.text },
  subtitle: { ...typography.subhead, color: colors.textSecondary },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F4F4F5',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    ...typography.subhead,
    color: colors.text,
    paddingVertical: 10,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: 'transparent',
  },
  pillActive: { backgroundColor: colors.primary },
  pillLabel: { ...typography.footnote, fontWeight: '700', color: colors.textSecondary },
  pillLabelActive: { color: '#fff' },
  pillCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  pillCountActive: { backgroundColor: 'rgba(255,255,255,0.28)' },
  pillCountText: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },
  pillCountTextActive: { color: '#fff' },
  list: { paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowHighlight: {
    backgroundColor: colors.primarySoft,
    borderBottomColor: 'transparent',
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radii.lg,
    borderBottomWidth: 0,
    paddingHorizontal: spacing.md,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.border,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  supportThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  thumbLetter: { ...typography.headline, color: colors.primaryDark },
  rowBody: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  name: { ...typography.headline, color: colors.text, flexShrink: 1 },
  hostPill: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hostPillText: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },
  time: { ...typography.caption, color: colors.textTertiary },
  listing: { ...typography.footnote, color: colors.textSecondary },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: { ...typography.footnote, color: colors.textTertiary, flex: 1 },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl * 2,
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.title3, color: colors.text },
  emptyBody: {
    ...typography.subhead,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
