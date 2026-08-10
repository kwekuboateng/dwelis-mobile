import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme';

export type SearchSummary = {
  where?: string;
  dates?: string;
  guests?: string;
};

type SearchChromeProps = {
  title?: string;
  summary?: SearchSummary;
  activeChips?: string[];
  filterLabels?: string[];
  resultCountLabel?: string;
  sortLabel?: string;
  onBack?: () => void;
  onSearchPress?: () => void;
  onClearChips?: () => void;
  onMapPress?: () => void;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
};

const DEFAULT_FILTERS = [
  'Price',
  'Property Type',
  'Bedrooms',
  'Beds',
  'Amenities',
  'Instant Book',
  'More Filters',
  'Sort',
];

export function SearchChrome({
  title = 'Search Results',
  summary,
  activeChips = [],
  filterLabels = DEFAULT_FILTERS,
  resultCountLabel,
  sortLabel,
  onBack,
  onSearchPress,
  onClearChips,
  onMapPress,
  children,
  headerExtra,
}: SearchChromeProps) {
  const mapStub = () => onMapPress?.() ?? Alert.alert('Map', 'Map view is coming soon.');

  return (
    <View style={styles.root}>
      <View style={styles.nav}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>{title}</Text>
        <Pressable onPress={mapStub} style={styles.mapLink}>
          <Ionicons name="map-outline" size={16} color={colors.text} />
          <Text style={styles.mapLinkText}>Map</Text>
        </Pressable>
      </View>

      <Pressable onPress={onSearchPress} style={styles.searchCard}>
        <View style={styles.field}>
          <Ionicons name="location-outline" size={14} color={colors.primaryDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldValue} numberOfLines={1}>
              {summary?.where || 'Anywhere'}
            </Text>
            <Text style={styles.fieldLabel}>Where</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.field}>
          <Ionicons name="calendar-outline" size={14} color={colors.primaryDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldValue} numberOfLines={1}>
              {summary?.dates || 'Add dates'}
            </Text>
            <Text style={styles.fieldLabel}>Dates</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.field}>
          <Ionicons name="person-outline" size={14} color={colors.primaryDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldValue} numberOfLines={1}>
              {summary?.guests || 'Add guests'}
            </Text>
            <Text style={styles.fieldLabel}>Guests</Text>
          </View>
        </View>
        <View style={styles.searchBtn}>
          <Ionicons name="search" size={16} color="#fff" />
        </View>
      </Pressable>

      {headerExtra}

      {activeChips.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {activeChips.map((chip) => (
            <View key={chip} style={styles.chip}>
              <Text style={styles.chipText}>{chip}</Text>
              <Ionicons name="close" size={12} color={colors.primaryDark} />
            </View>
          ))}
          <Pressable onPress={onClearChips}>
            <Text style={styles.clearAll}>Clear All</Text>
          </Pressable>
        </ScrollView>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filterLabels.map((label) => (
          <Pressable
            key={label}
            style={styles.filterBtn}
            onPress={() => Alert.alert(label, 'Filter options are coming soon.')}
          >
            <Text style={styles.filterText}>{label}</Text>
            <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
          </Pressable>
        ))}
      </ScrollView>

      {(resultCountLabel || sortLabel) && (
        <View style={styles.countRow}>
          {resultCountLabel ? <Text style={styles.count}>{resultCountLabel}</Text> : <View />}
          {sortLabel ? (
            <Pressable
              style={styles.sortBtn}
              onPress={() => Alert.alert('Sort', 'Sorting options are coming soon.')}
            >
              <Text style={styles.sortText}>{sortLabel}</Text>
              <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      )}

      <View style={styles.body}>{children}</View>

      <Pressable style={styles.mapFab} onPress={mapStub}>
        <Ionicons name="map" size={16} color="#fff" />
        <Text style={styles.mapFabText}>Map</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  navTitle: { ...typography.headline, color: colors.text, flex: 1, textAlign: 'center' },
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 56 },
  mapLinkText: { ...typography.footnote, fontWeight: '600', color: colors.text },
  searchCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  field: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 },
  fieldValue: { fontSize: 12, fontWeight: '700', color: colors.text },
  fieldLabel: { fontSize: 10, color: colors.textTertiary },
  divider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: colors.border, marginHorizontal: 4 },
  searchBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.primaryDark },
  clearAll: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  filterRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  filterText: { fontSize: 12, fontWeight: '600', color: colors.text },
  countRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: { ...typography.subhead, fontWeight: '700', color: colors.text },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText: { ...typography.caption, color: colors.textSecondary },
  body: { flex: 1 },
  mapFab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryDark,
    borderRadius: radii.full,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  mapFabText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
