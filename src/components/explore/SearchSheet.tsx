import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateRangeCalendar } from '@/components/explore/DateRangeCalendar';
import { api } from '@/shared/context/AuthContext';
import {
  emptySearchDraft,
  formatDateRange,
  formatGuests,
  isSearchDraftEmpty,
  type SearchDraft,
} from '@/shared/utils/searchDraft';
import { colors, minTouchSize, radii, spacing, typography } from '@/theme';

export type SearchField = 'where' | 'dates' | 'guests';

type SearchSheetProps = {
  visible: boolean;
  /** Section expanded when the sheet opens — driven by which search-card field was tapped. */
  focusField: SearchField;
  value: SearchDraft;
  onClose: () => void;
  onSubmit: (draft: SearchDraft) => void;
};

type Prediction = { placeId: string; description: string };

const POPULAR_CITIES = ['Accra', 'Kumasi', 'Takoradi', 'Cape Coast', 'Tamale', 'Ho'];

const GUEST_ROWS = [
  { key: 'adults', label: 'Adults', hint: 'Ages 13 or above', min: 0, max: 16 },
  { key: 'children', label: 'Children', hint: 'Ages 2 – 12', min: 0, max: 10 },
  { key: 'infants', label: 'Infants', hint: 'Under 2', min: 0, max: 5 },
] as const;

const rowRipple = Platform.select({
  android: { color: colors.ripple },
  default: undefined,
});

const iconRipple = Platform.select({
  android: { color: colors.ripple, borderless: true, radius: minTouchSize / 2 },
  default: undefined,
});

export function SearchSheet({ visible, focusField, value, onClose, onSubmit }: SearchSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [draft, setDraft] = useState<SearchDraft>(value);
  const [section, setSection] = useState<SearchField>(focusField);
  const [query, setQuery] = useState(value.where);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [placesUnavailable, setPlacesUnavailable] = useState(false);
  const whereInput = useRef<TextInput>(null);

  // Re-seed from the caller each time the sheet opens so a cancelled edit is discarded.
  // `value` only changes on submit (when the sheet closes), so this never clobbers live input.
  useEffect(() => {
    if (!visible) return;
    setDraft(value);
    setQuery(value.where);
    setSection(focusField);
    setPredictions([]);
  }, [visible, value, focusField]);

  useEffect(() => {
    if (!visible || section !== 'where') return;
    const timer = setTimeout(() => whereInput.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, [visible, section]);

  useEffect(() => {
    if (!visible || section !== 'where') return;
    const input = query.trim();
    if (input.length < 2) {
      setPredictions([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<{ predictions?: Prediction[] }>('/places/autocomplete', {
          params: { input },
        });
        if (cancelled) return;
        setPredictions(Array.isArray(res.data?.predictions) ? res.data.predictions.slice(0, 6) : []);
        setPlacesUnavailable(false);
      } catch {
        if (cancelled) return;
        setPredictions([]);
        setPlacesUnavailable(true);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, section, visible]);

  const selectPrediction = useCallback(async (prediction: Prediction) => {
    const cityGuess = prediction.description.split(',')[0]?.trim();
    setQuery(prediction.description);
    setDraft((prev) => ({ ...prev, where: prediction.description, city: cityGuess }));
    setPredictions([]);
    setSection('dates');

    try {
      const res = await api.get<{ city?: string }>('/places/details', {
        params: { place_id: prediction.placeId },
      });
      const city = res.data?.city?.trim();
      if (city) setDraft((prev) => ({ ...prev, city }));
    } catch {
      /* the description-derived city stays as the fallback */
    }
  }, []);

  const selectCity = (city: string) => {
    setQuery(city);
    setDraft((prev) => ({ ...prev, where: city, city }));
    setPredictions([]);
    setSection('dates');
  };

  const stepGuests = (key: (typeof GUEST_ROWS)[number]['key'], delta: number) => {
    const row = GUEST_ROWS.find((r) => r.key === key)!;
    setDraft((prev) => ({
      ...prev,
      [key]: Math.min(row.max, Math.max(row.min, prev[key] + delta)),
    }));
  };

  const submit = () => {
    const trimmed = query.trim();
    // Free text the guest never picked from the list still counts as a destination.
    const next: SearchDraft = {
      ...draft,
      where: trimmed,
      city: draft.where.trim() === trimmed ? draft.city : trimmed || undefined,
    };
    onSubmit(next);
  };

  const dateLabel = formatDateRange(draft.checkIn, draft.checkOut);
  const guestLabel = formatGuests(draft);

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropFill}
          accessibilityRole="button"
          accessibilityLabel="Close search"
          onPress={onClose}
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, spacing.md),
                maxHeight: windowHeight * 0.9,
              },
            ]}
          >
            <View style={styles.grabber} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Search stays</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close search"
                android_ripple={iconRipple}
                onPress={onClose}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Section
                icon="location-outline"
                label="Where"
                summary={draft.where || 'Search by location'}
                expanded={section === 'where'}
                onPress={() => setSection('where')}
              >
                <View style={styles.inputWrap}>
                  <Ionicons name="search" size={18} color={colors.textSecondary} />
                  <TextInput
                    ref={whereInput}
                    value={query}
                    onChangeText={setQuery}
                    placeholder="City, neighbourhood or landmark"
                    placeholderTextColor={colors.textTertiary}
                    style={styles.input}
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={() => setSection('dates')}
                    accessibilityLabel="Destination"
                  />
                  {query.length > 0 ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear destination"
                      android_ripple={iconRipple}
                      hitSlop={8}
                      onPress={() => {
                        setQuery('');
                        setDraft((prev) => ({ ...prev, where: '', city: undefined }));
                      }}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                    </Pressable>
                  ) : null}
                </View>

                {searching ? (
                  <ActivityIndicator color={colors.primary} style={styles.inlineLoader} />
                ) : null}

                {predictions.map((prediction) => (
                  <Pressable
                    key={prediction.placeId}
                    accessibilityRole="button"
                    android_ripple={rowRipple}
                    onPress={() => void selectPrediction(prediction)}
                    style={styles.suggestion}
                  >
                    <Ionicons name="location-outline" size={18} color={colors.primaryDark} />
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {prediction.description}
                    </Text>
                  </Pressable>
                ))}

                {predictions.length === 0 && !searching ? (
                  <>
                    {placesUnavailable && query.trim().length >= 2 ? (
                      <Text style={styles.helper}>
                        Location suggestions are unavailable — search with the text you typed.
                      </Text>
                    ) : null}
                    <Text style={styles.helper}>Popular destinations</Text>
                    <View style={styles.chipWrap}>
                      {POPULAR_CITIES.map((city) => (
                        <Pressable
                          key={city}
                          accessibilityRole="button"
                          android_ripple={rowRipple}
                          onPress={() => selectCity(city)}
                          style={styles.chip}
                        >
                          <Text style={styles.chipText}>{city}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                ) : null}
              </Section>

              <Section
                icon="calendar-outline"
                label="Dates"
                summary={dateLabel ?? 'Add dates'}
                expanded={section === 'dates'}
                onPress={() => setSection('dates')}
              >
                <DateRangeCalendar
                  checkIn={draft.checkIn}
                  checkOut={draft.checkOut}
                  onChange={(range) => setDraft((prev) => ({ ...prev, ...range }))}
                />
              </Section>

              <Section
                icon="person-outline"
                label="Guests"
                summary={guestLabel ?? 'Add guests'}
                expanded={section === 'guests'}
                onPress={() => setSection('guests')}
              >
                {GUEST_ROWS.map((row) => (
                  <View key={row.key} style={styles.guestRow}>
                    <View style={styles.guestCopy}>
                      <Text style={styles.guestLabel}>{row.label}</Text>
                      <Text style={styles.guestHint}>{row.hint}</Text>
                    </View>
                    <View style={styles.stepper}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove one ${row.label.toLowerCase()}`}
                        accessibilityState={{ disabled: draft[row.key] <= row.min }}
                        android_ripple={iconRipple}
                        disabled={draft[row.key] <= row.min}
                        onPress={() => stepGuests(row.key, -1)}
                        style={[
                          styles.stepBtn,
                          draft[row.key] <= row.min && styles.stepBtnDisabled,
                        ]}
                      >
                        <Ionicons name="remove" size={18} color={colors.text} />
                      </Pressable>
                      <Text style={styles.stepValue} maxFontSizeMultiplier={1.3}>
                        {draft[row.key]}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Add one ${row.label.toLowerCase()}`}
                        accessibilityState={{ disabled: draft[row.key] >= row.max }}
                        android_ripple={iconRipple}
                        disabled={draft[row.key] >= row.max}
                        onPress={() => stepGuests(row.key, 1)}
                        style={[
                          styles.stepBtn,
                          draft[row.key] >= row.max && styles.stepBtnDisabled,
                        ]}
                      >
                        <Ionicons name="add" size={18} color={colors.text} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </Section>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                accessibilityRole="button"
                android_ripple={rowRipple}
                disabled={isSearchDraftEmpty(draft) && !query.trim()}
                onPress={() => {
                  setQuery('');
                  setDraft(emptySearchDraft);
                }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearText}>Clear all</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Search stays"
                android_ripple={Platform.select({
                  android: { color: colors.rippleLight },
                  default: undefined,
                })}
                onPress={submit}
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && Platform.OS === 'ios' && styles.submitPressed,
                ]}
              >
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={styles.submitText}>Search</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

type SectionProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  summary: string;
  expanded: boolean;
  onPress: () => void;
  children: React.ReactNode;
};

function Section({ icon, label, summary, expanded, onPress, children }: SectionProps) {
  return (
    <View style={[styles.section, expanded && styles.sectionExpanded]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${summary}`}
        accessibilityState={{ expanded }}
        android_ripple={rowRipple}
        onPress={onPress}
        style={styles.sectionHeader}
      >
        <Ionicons name={icon} size={18} color={colors.primaryDark} />
        <Text style={styles.sectionLabel}>{label}</Text>
        <Text style={styles.sectionSummary} numberOfLines={1}>
          {summary}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textSecondary}
        />
      </Pressable>
      {expanded ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  backdropFill: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  sheetTitle: { ...typography.title3, color: colors.text },
  closeBtn: {
    width: minTouchSize,
    height: minTouchSize,
    borderRadius: minTouchSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flexShrink: 1 },
  bodyContent: { gap: spacing.sm, paddingBottom: spacing.md },
  section: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionExpanded: { borderColor: colors.primary },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: minTouchSize,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionLabel: { ...typography.subhead, fontWeight: '700', color: colors.text },
  sectionSummary: { ...typography.footnote, color: colors.textSecondary, flex: 1, textAlign: 'right' },
  sectionBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    minHeight: minTouchSize,
  },
  input: { flex: 1, ...typography.callout, color: colors.text, paddingVertical: spacing.sm },
  inlineLoader: { alignSelf: 'flex-start', marginVertical: spacing.xs },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: minTouchSize,
    paddingVertical: spacing.xs,
  },
  suggestionText: { ...typography.subhead, color: colors.text, flex: 1 },
  helper: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  chipText: { ...typography.footnote, fontWeight: '600', color: colors.text },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  guestCopy: { flex: 1 },
  guestLabel: { ...typography.subhead, fontWeight: '600', color: colors.text },
  guestHint: { ...typography.caption, color: colors.textSecondary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: {
    width: minTouchSize - 8,
    height: minTouchSize - 8,
    borderRadius: (minTouchSize - 8) / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stepBtnDisabled: { opacity: 0.4 },
  stepValue: { ...typography.subhead, fontWeight: '700', color: colors.text, minWidth: 20, textAlign: 'center' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  clearBtn: {
    minHeight: minTouchSize,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  clearText: { ...typography.subhead, fontWeight: '700', color: colors.text },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    minHeight: minTouchSize,
    overflow: 'hidden',
  },
  submitPressed: { opacity: 0.9 },
  submitText: { ...typography.headline, color: '#fff' },
});
