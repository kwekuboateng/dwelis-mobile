import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ExploreHeader } from '@/components/explore/ExploreHeader';
import { SavedGridCard } from '@/components/listings/ResultCards';
import { NativeButton } from '@/components/ui/NativeButton';
import { api, useAuth } from '@/shared/context/AuthContext';
import { useBookmarks } from '@/shared/context/BookmarkContext';
import { normalizePaginated } from '@/shared/utils/pagination';
import type { Listing } from '@/shared/types/listing';
import type { GuestTabParamList, RootStackParamList } from '@/navigation/types';
import { colors, spacing, typography } from '@/theme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<GuestTabParamList, 'Saved'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function SavedEmptyArt() {
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

export function SavedScreen() {
  const navigation = useNavigation<Nav>();
  const { token } = useAuth();
  const { bookmarkedIds, ready } = useBookmarks();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        const res = await api.get('/me/bookmarks', { params: { page: '1', limit: '40' } });
        const page = normalizePaginated<Listing>(res.data);
        setListings(page.items);
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

  const visible = ready ? listings.filter((l) => bookmarkedIds.has(l.id)) : listings;
  const count = ready ? bookmarkedIds.size : visible.length;

  return (
    <View style={styles.root}>
      <ExploreHeader onProfilePress={() => navigation.navigate('Profile')} />
      <View style={styles.titleRow}>
        <Text style={styles.title}>Saved</Text>
        <Pressable hitSlop={8}>
          <Ionicons name="options-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : visible.length === 0 ? (
        <View style={styles.empty}>
          <SavedEmptyArt />
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.emptyBody}>
            Save your favourite stays to quickly find them later.
          </Text>
          <NativeButton
            label="Explore Stays"
            onPress={() => navigation.navigate('Explore')}
            style={{ alignSelf: 'stretch', marginTop: spacing.md }}
          />
        </View>
      ) : (
        <>
          <View style={styles.subhead}>
            <Text style={styles.collections}>Saved Collections</Text>
            <Text style={styles.count}>{count} properties</Text>
          </View>
          <FlatList
            data={visible}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.grid}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void load(true)}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => (
              <SavedGridCard
                listing={item}
                onPress={() => navigation.navigate('ListingDetail', { id: item.id })}
              />
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  titleRow: {
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: { ...typography.title1, color: colors.text },
  subhead: {
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  collections: { ...typography.headline, color: colors.text },
  count: { ...typography.footnote, color: colors.textSecondary },
  grid: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  gridRow: { justifyContent: 'space-between' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
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
