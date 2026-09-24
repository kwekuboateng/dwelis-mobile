import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api, useAuth } from '@/shared/context/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';

type ChatMessage = {
  id: string;
  content: string;
  createdAt?: string | null;
  isMine: boolean;
  senderName?: string | null;
  avatarUrl?: string | null;
};

function pickString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v;
  }
  return undefined;
}

function extractMessages(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const d = data as Record<string, unknown> | null;
  if (!d) return [];
  for (const key of ['items', 'data', 'messages', 'results']) {
    if (Array.isArray(d[key])) return d[key] as unknown[];
  }
  return [];
}

function formatMsgTime(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatDayLabel(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function dayKey(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function ChatThreadScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ChatThread'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { conversationId, kind, title, subtitle, hostName, role } = route.params;
  const isHostRole = role === 'host';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const displayName = hostName || title || (isHostRole ? 'Guest' : 'Host');
  const listingTitle = subtitle || title || 'Stay';

  const normalizeMessage = useCallback(
    (raw: unknown): ChatMessage | null => {
      if (!raw || typeof raw !== 'object') return null;
      const r = raw as Record<string, unknown>;
      const id = pickString(r.id, r.messageId) || String(Math.random());
      const content = pickString(r.content, r.body, r.text, r.message) || '';
      if (!content) return null;

      const senderId = pickString(
        r.senderId,
        r.userId,
        (r.sender as { id?: string } | undefined)?.id,
      );
      const senderRole = String(r.senderRole ?? r.role ?? r.from ?? '').toLowerCase();
      const fromGuest =
        r.fromGuest === true ||
        senderRole.includes('guest') ||
        senderRole.includes('traveller') ||
        senderRole.includes('traveler');
      const fromHost = r.fromHost === true || senderRole.includes('host');

      let isMine = false;
      if (r.isMine === true || r.mine === true) {
        isMine = true;
      } else if (r.isMine === false) {
        isMine = false;
      } else if (senderId && user?.id) {
        isMine = senderId === user.id;
      } else if (isHostRole) {
        isMine = fromHost || (!fromGuest && Boolean(r.sentByHost));
      } else {
        isMine = fromGuest || Boolean(r.isGuest || r.sentByGuest);
      }

      return {
        id,
        content,
        createdAt: pickString(r.createdAt, r.sentAt, r.timestamp) || null,
        isMine,
        senderName: pickString(
          r.senderName,
          (r.sender as { fullName?: string } | undefined)?.fullName,
        ),
        avatarUrl: pickString(
          r.avatarUrl,
          (r.sender as { avatarUrl?: string } | undefined)?.avatarUrl,
        ),
      };
    },
    [user?.id, isHostRole],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const path =
        kind === 'reservation'
          ? `/chat/reservations/${conversationId}/messages`
          : `/chat/inquiries/${conversationId}/messages`;
      const res = await api.get(path);
      const list = extractMessages(res.data)
        .map(normalizeMessage)
        .filter((m): m is ChatMessage => Boolean(m));
      setMessages(list);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, kind, normalizeMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  const send = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      isMine: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    try {
      if (kind === 'reservation') {
        await api.post('/chat/messages', { bookingId: conversationId, content });
      } else {
        await api.post(`/chat/inquiries/${conversationId}/messages`, { content });
      }
      await load();
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(content);
      Alert.alert('Could not send', 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const prev = index > 0 ? messages[index - 1] : null;
    const showDay = !prev || dayKey(prev.createdAt) !== dayKey(item.createdAt);

    return (
      <View>
        {showDay && item.createdAt ? (
          <View style={styles.dayPillWrap}>
            <Text style={styles.dayPill}>{formatDayLabel(item.createdAt)}</Text>
          </View>
        ) : null}
        <View style={[styles.bubbleRow, item.isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
          {!item.isMine ? (
            item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.msgAvatar} contentFit="cover" />
            ) : (
              <View style={[styles.msgAvatar, styles.msgAvatarFallback]}>
                <Text style={styles.msgAvatarLetter}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )
          ) : (
            <View style={{ width: 28 }} />
          )}
          <View style={[styles.bubble, item.isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={styles.bubbleText}>{item.content}</Text>
            <View style={styles.bubbleMeta}>
              <Text style={styles.bubbleTime}>{formatMsgTime(item.createdAt)}</Text>
              {item.isMine ? (
                <Ionicons name="checkmark-done" size={14} color={colors.primaryDark} />
              ) : null}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, styles.msgAvatarFallback]}>
            <Text style={styles.msgAvatarLetter}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerText}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={styles.hostPill}>
                <Text style={styles.hostPillText}>Host</Text>
              </View>
            </View>
            <Text style={styles.headerSub} numberOfLines={1}>
              {listingTitle}
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.headerBtn}
          hitSlop={8}
          onPress={() => Alert.alert('More', 'Conversation options coming soon.')}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View style={[styles.summaryThumb, styles.msgAvatarFallback]}>
            <Ionicons name="home" size={18} color={colors.primaryDark} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.summaryTitle} numberOfLines={1}>
              {listingTitle}
            </Text>
            <View style={styles.upcomingPill}>
              <Text style={styles.upcomingText}>Upcoming</Text>
            </View>
            <View style={styles.summaryDates}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.summaryMeta}>Dates in your booking</Text>
            </View>
          </View>
        </View>
        <View style={styles.actionRow}>
          <ActionChip
            icon="calendar-outline"
            label="View Booking"
            onPress={() => Alert.alert('Coming soon', 'Booking details coming soon.')}
          />
          <ActionChip
            icon="call-outline"
            label="Call Host"
            onPress={() => Alert.alert('Coming soon', 'Calling host is not available yet.')}
          />
          <ActionChip
            icon="navigate-outline"
            label="Get Directions"
            onPress={() => Alert.alert('Coming soon', 'Directions will be available soon.')}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyMessages}>Say hello to start the conversation.</Text>
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <Pressable
          style={styles.composerIcon}
          onPress={() => Alert.alert('Attach', 'Attachments coming soon.')}
        >
          <Ionicons name="attach" size={20} color={colors.text} />
        </Pressable>
        <Pressable
          style={styles.composerIcon}
          onPress={() => Alert.alert('Camera', 'Camera attachments coming soon.')}
        >
          <Ionicons name="camera-outline" size={20} color={colors.text} />
        </Pressable>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message..."
          placeholderTextColor={colors.textTertiary}
          style={styles.composerInput}
          multiline
        />
        <Pressable
          style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
          onPress={() => void send()}
          disabled={!draft.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function ActionChip({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionChip} onPress={onPress}>
      <Ionicons name={icon} size={14} color={colors.text} />
      <Text style={styles.actionChipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 4,
    backgroundColor: colors.surface,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerText: { flex: 1, gap: 2 },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerName: { ...typography.headline, color: colors.text, flexShrink: 1 },
  hostPill: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hostPillText: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },
  headerSub: { ...typography.caption, color: colors.textSecondary },
  summaryCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  summaryTop: { flexDirection: 'row', gap: spacing.md },
  summaryThumb: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: { ...typography.headline, color: colors.text },
  upcomingPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  upcomingText: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },
  summaryDates: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryMeta: { ...typography.caption, color: colors.textSecondary },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionChip: {
    flex: 1,
    minHeight: 36,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  actionChipText: { fontSize: 11, fontWeight: '600', color: colors.text },
  messages: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm },
  emptyMessages: {
    ...typography.subhead,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  dayPillWrap: { alignItems: 'center', marginVertical: spacing.sm },
  dayPill: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing.sm, gap: 8 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border },
  msgAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  msgAvatarLetter: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  bubble: {
    maxWidth: '78%',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  bubbleMine: { backgroundColor: colors.primarySoft },
  bubbleText: { ...typography.subhead, color: colors.text, lineHeight: 20 },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bubbleTime: { ...typography.caption, color: colors.textTertiary },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  composerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: radii.lg,
    backgroundColor: '#F4F4F5',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...typography.subhead,
    color: colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: { opacity: 0.5 },
});
