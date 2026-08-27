import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  MONTHS_LONG,
  WEEKDAYS_SHORT,
  addDays,
  addMonths,
  fromIsoDate,
  startOfToday,
  toIsoDate,
} from '@/shared/utils/searchDraft';
import { colors, minTouchSize, radii, spacing, typography } from '@/theme';

type DateRangeCalendarProps = {
  /** ISO `YYYY-MM-DD`. */
  checkIn?: string;
  checkOut?: string;
  onChange: (range: { checkIn?: string; checkOut?: string }) => void;
};

const iconRipple = Platform.select({
  android: { color: colors.ripple, borderless: true, radius: minTouchSize / 2 },
  default: undefined,
});

const chipRipple = Platform.select({
  android: { color: colors.ripple },
  default: undefined,
});

export function DateRangeCalendar({ checkIn, checkOut, onChange }: DateRangeCalendarProps) {
  const [month, setMonth] = useState(() => {
    const anchor = checkIn ? fromIsoDate(checkIn) : startOfToday();
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  });

  const grid = useMemo(() => buildMonthGrid(month), [month]);
  const today = useMemo(() => toIsoDate(startOfToday()), []);
  const canGoBack = useMemo(() => {
    const now = startOfToday();
    return month > new Date(now.getFullYear(), now.getMonth(), 1);
  }, [month]);

  /** First tap sets check-in, second sets check-out; an earlier day restarts the range. */
  const selectDay = (iso: string) => {
    if (!checkIn || checkOut) return onChange({ checkIn: iso, checkOut: undefined });
    if (iso <= checkIn) return onChange({ checkIn: iso, checkOut: undefined });
    return onChange({ checkIn, checkOut: iso });
  };

  return (
    <>
      <View style={styles.monthNav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          accessibilityState={{ disabled: !canGoBack }}
          android_ripple={iconRipple}
          disabled={!canGoBack}
          onPress={() => setMonth((m) => addMonths(m, -1))}
          style={styles.monthBtn}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={canGoBack ? colors.text : colors.textTertiary}
          />
        </Pressable>
        <Text style={styles.monthLabel} maxFontSizeMultiplier={1.4}>
          {MONTHS_LONG[month.getMonth()]} {month.getFullYear()}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          android_ripple={iconRipple}
          onPress={() => setMonth((m) => addMonths(m, 1))}
          style={styles.monthBtn}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS_SHORT.map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekday} maxFontSizeMultiplier={1.3}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.dayGrid}>
        {grid.map((cell, index) => {
          if (!cell) return <View key={`pad-${index}`} style={styles.dayCell} />;

          const iso = toIsoDate(cell);
          const disabled = iso < today;
          const isStart = iso === checkIn;
          const isEnd = iso === checkOut;
          const inRange = !!checkIn && !!checkOut && iso > checkIn && iso < checkOut;

          return (
            <Pressable
              key={iso}
              accessibilityRole="button"
              accessibilityLabel={`${cell.getDate()} ${MONTHS_LONG[cell.getMonth()]}`}
              accessibilityState={{ selected: isStart || isEnd, disabled }}
              disabled={disabled}
              onPress={() => selectDay(iso)}
              style={styles.dayCell}
            >
              <View
                style={[
                  styles.day,
                  inRange && styles.dayInRange,
                  (isStart || isEnd) && styles.daySelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    disabled && styles.dayTextDisabled,
                    (isStart || isEnd) && styles.dayTextSelected,
                  ]}
                  maxFontSizeMultiplier={1.3}
                >
                  {cell.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          android_ripple={chipRipple}
          onPress={() => {
            const start = startOfToday();
            onChange({ checkIn: toIsoDate(start), checkOut: toIsoDate(addDays(start, 2)) });
          }}
          style={styles.chip}
        >
          <Text style={styles.chipText}>Next 2 nights</Text>
        </Pressable>
        {checkIn ? (
          <Pressable
            accessibilityRole="button"
            android_ripple={chipRipple}
            onPress={() => onChange({ checkIn: undefined, checkOut: undefined })}
            style={styles.chip}
          >
            <Text style={styles.chipText}>Clear dates</Text>
          </Pressable>
        ) : null}
      </View>
    </>
  );
}

/** Leading blanks so the 1st lands on its weekday, then every day of the month. */
function buildMonthGrid(month: Date): (Date | null)[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let day = 1; day <= dayCount; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  return cells;
}

const styles = StyleSheet.create({
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthBtn: {
    width: minTouchSize,
    height: minTouchSize,
    borderRadius: minTouchSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: { ...typography.headline, color: colors.text },
  weekRow: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInRange: { backgroundColor: colors.primaryMuted, borderRadius: 0, width: '100%' },
  daySelected: { backgroundColor: colors.primary },
  dayText: { ...typography.subhead, color: colors.text },
  dayTextDisabled: { color: colors.textTertiary },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  chipText: { ...typography.footnote, fontWeight: '600', color: colors.text },
});
