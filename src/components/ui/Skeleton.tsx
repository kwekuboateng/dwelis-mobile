import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii } from '@/theme';

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radii.sm,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

/**
 * Placeholders for the data-driven rails only — the hero and search card render
 * immediately, so skeletoning them again would show a second hero while loading.
 */
export function HomeLoadingSkeleton() {
  return (
    <View style={styles.homeRoot}>
      <View style={styles.section}>
        <Skeleton width="55%" height={18} />
        <View style={styles.row}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.catTile}>
              <Skeleton width={132} height={110} borderRadius={0} />
              <View style={styles.catTileBody}>
                <Skeleton width="80%" height={12} />
                <Skeleton width="50%" height={10} />
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Skeleton width="45%" height={18} />
        <View style={styles.row}>
          {[0, 1].map((i) => (
            <View key={i} style={styles.cardTile}>
              <Skeleton width={260} height={188} borderRadius={radii.lg} />
              <Skeleton width="70%" height={14} />
              <Skeleton width="50%" height={12} />
              <Skeleton width="40%" height={12} />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Skeleton width="60%" height={18} />
        <View style={styles.row}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.compactTile}>
              <Skeleton width={150} height={120} borderRadius={radii.lg} />
              <Skeleton width="85%" height={12} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.border,
  },
  homeRoot: {
    paddingHorizontal: 16,
    gap: 24,
    paddingBottom: 32,
  },
  section: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    overflow: 'hidden',
  },
  catTile: {
    width: 132,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  catTileBody: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 6,
  },
  cardTile: {
    width: 260,
    gap: 8,
  },
  compactTile: {
    width: 150,
    gap: 8,
  },
});
