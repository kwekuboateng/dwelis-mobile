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

export function HomeLoadingSkeleton() {
  return (
    <View style={styles.homeRoot}>
      <Skeleton height={280} borderRadius={radii.xl} />
      <View style={styles.searchBar}>
        <Skeleton height={52} borderRadius={radii.xl} />
      </View>
      <View style={styles.section}>
        <Skeleton width="55%" height={18} />
        <View style={styles.row}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.catTile}>
              <Skeleton width={128} height={150} borderRadius={radii.lg} />
              <Skeleton width="80%" height={12} />
              <Skeleton width="50%" height={10} />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Skeleton width="45%" height={18} />
        <View style={styles.row}>
          {[0, 1].map((i) => (
            <View key={i} style={styles.cardTile}>
              <Skeleton width={260} height={180} borderRadius={radii.lg} />
              <Skeleton width="70%" height={14} />
              <Skeleton width="50%" height={12} />
              <Skeleton width="40%" height={12} />
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
    gap: 20,
    paddingBottom: 32,
  },
  searchBar: {
    marginTop: -40,
  },
  section: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  catTile: {
    width: 128,
    gap: 8,
  },
  cardTile: {
    width: 260,
    gap: 8,
  },
});
