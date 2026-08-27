import React from 'react';
import { Platform, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBookmarks } from '@/shared/context/BookmarkContext';
import { colors } from '@/theme';

type SaveButtonProps = {
  listingId: string;
  title?: string;
  source?: 'property_card' | 'listing_details' | 'search_results' | 'homepage' | 'saved_stays';
  size?: number;
  style?: StyleProp<ViewStyle>;
  filledWhenSaved?: boolean;
};

export function SaveButton({
  listingId,
  title,
  source = 'property_card',
  size = 18,
  style,
  filledWhenSaved = true,
}: SaveButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const saved = isBookmarked(listingId);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        title
          ? `${saved ? 'Remove' : 'Save'} ${title}${saved ? ' from saved stays' : ' to saved stays'}`
          : saved
            ? 'Remove from saved'
            : 'Save stay'
      }
      accessibilityState={{ selected: saved }}
      android_ripple={Platform.select({
        android: { color: colors.ripple, borderless: true, radius: 22 },
        default: undefined,
      })}
      hitSlop={12}
      onPress={(e) => {
        e.stopPropagation?.();
        void toggleBookmark(listingId, { title, source });
      }}
      style={({ pressed }) => [
        styles.btn,
        pressed && Platform.OS === 'ios' && styles.pressed,
        style,
      ]}
    >
      <Ionicons
        name={saved && filledWhenSaved ? 'heart' : 'heart-outline'}
        size={size}
        color={saved && filledWhenSaved ? colors.error : colors.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
