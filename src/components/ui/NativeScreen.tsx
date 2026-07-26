import React from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';

type NativeScreenProps = ScrollViewProps & {
  children: React.ReactNode;
  padded?: boolean;
  scroll?: boolean;
  edges?: ('top' | 'bottom')[];
};

export function NativeScreen({
  children,
  padded = true,
  scroll = true,
  edges = ['top', 'bottom'],
  contentContainerStyle,
  style,
  ...rest
}: NativeScreenProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = edges.includes('top') ? insets.top : 0;
  const paddingBottom = edges.includes('bottom') ? Math.max(insets.bottom, 16) : 0;

  const content = (
    <View
      style={[
        styles.inner,
        padded && styles.padded,
        { paddingTop, paddingBottom },
        !scroll && contentContainerStyle,
        !scroll && style,
      ]}
    >
      {children}
    </View>
  );

  if (!scroll) {
    return <View style={[styles.root, style]}>{content}</View>;
  }

  return (
    <ScrollView
      style={[styles.root, style]}
      contentContainerStyle={[styles.scrollContent, padded && styles.padded, contentContainerStyle]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    backgroundColor: colors.background,
  },
  padded: {
    paddingHorizontal: 20,
  },
});
