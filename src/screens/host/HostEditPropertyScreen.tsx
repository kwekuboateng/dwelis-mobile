import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NativeButton } from '@/components/ui/NativeButton';
import { api, useAuth } from '@/shared/context/AuthContext';
import type { HostListing } from '@/shared/types/host';
import { coverUrl } from '@/shared/types/host';
import type { RootStackParamList } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'HostEditProperty'>;

type PropertyStatus = 'active' | 'draft';

type PropertyType = 'Apartment' | 'House' | 'Villa' | 'Studio' | 'Other';

const PROPERTY_TYPES: PropertyType[] = ['Apartment', 'House', 'Villa', 'Studio', 'Other'];

export function HostEditPropertyScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const id = route.params?.id;

  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('Apartment');
  const [description, setDescription] = useState('');
  const [guests, setGuests] = useState('1');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [beds, setBeds] = useState('1');
  const [status, setStatus] = useState<PropertyStatus>('draft');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/listings/${id}`);
        if (cancelled) return;
        const listing: HostListing = res.data;
        setTitle(listing.title ?? '');
        setPropertyType((listing.propertyType as PropertyType) ?? 'Apartment');
        setDescription(listing.description ?? '');
        setGuests(String(listing.guestsCount ?? 1));
        setBedrooms(String(listing.bedroomCount ?? 1));
        setBathrooms(String(listing.bathroomCount ?? 1));
        setBeds(String(listing.bedsCount ?? 1));
        setStatus(String(listing.status ?? 'draft').toLowerCase() === 'active' ? 'active' : 'draft');
        setImageUrl(coverUrl(listing) ?? null);
      } catch {
        Alert.alert('Error', 'Failed to load property.');
        navigation.goBack();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, token, navigation]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Property name is required.');
      return;
    }
    if (title.length > 60) {
      Alert.alert('Validation', 'Property name must be 60 characters or less.');
      return;
    }
    if (description.length > 200) {
      Alert.alert('Validation', 'Short description must be 200 characters or less.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        propertyType,
        description: description || null,
        guestsCount: Number(guests) || 1,
        bedroomCount: Number(bedrooms) || 1,
        bathroomCount: Number(bathrooms) || 1,
        bedsCount: Number(beds) || 1,
        status,
      };

      if (id) {
        await api.patch(`/host/listings/${id}`, payload);
        Alert.alert('Success', 'Property updated successfully.');
      } else {
        const res = await api.post('/listings', payload);
        Alert.alert('Success', 'Property created successfully.');
        const newId = res.data?.id;
        if (newId) {
          navigation.replace('HostEditProperty', { id: newId });
        } else {
          navigation.goBack();
        }
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save property.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangeCover = () => {
    Alert.alert('Change Cover', 'Photo upload will be available in a later version.');
  };

  const handleAddHighlight = () => {
    Alert.alert('Add Highlight', 'Property highlights coming in a later version.');
  };

  const handleNext = () => {
    Alert.alert('Next Step', 'More setup steps coming in a later version.');
  };

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{id ? 'Edit Property' : 'New Property'}</Text>
        {status === 'active' && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        )}
        {status !== 'active' && <View style={{ width: 60 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stepper */}
        <View style={styles.stepper}>
          <StepIndicator label="1. Basic Info" active />
          <StepIndicator label="2. Location" active={false} />
          <StepIndicator label="3. Photos" active={false} />
          <StepIndicator label="4. Amenities" active={false} />
          <StepIndicator label="5. Pricing" active={false} />
          <StepIndicator label="6. Policies" active={false} />
          <StepIndicator label="7. Calendar" active={false} />
          <StepIndicator label="8. Publish" active={false} />
        </View>

        <View style={styles.form}>
          {/* Cover Image */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cover Image</Text>
            {imageUrl ? (
              <Pressable onPress={handleChangeCover}>
                <Image source={{ uri: imageUrl }} style={styles.coverImage} contentFit="cover" />
              </Pressable>
            ) : (
              <Pressable style={styles.coverPlaceholder} onPress={handleChangeCover}>
                <Ionicons name="camera-outline" size={32} color={colors.textTertiary} />
                <Text style={styles.coverPlaceholderText}>Change Cover</Text>
              </Pressable>
            )}
          </View>

          {/* Property Name */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Property Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Cozy 2BR Apartment in Accra"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              maxLength={60}
            />
            <Text style={styles.helper}>{title.length}/60 characters</Text>
          </View>

          {/* Property Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Property Type</Text>
            <View style={styles.chipsRow}>
              {PROPERTY_TYPES.map((pt) => {
                const active = propertyType === pt;
                return (
                  <Pressable
                    key={pt}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setPropertyType(pt)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{pt}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Short Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Short Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Brief summary of your property"
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={styles.helper}>{description.length}/200 characters</Text>
          </View>

          {/* Capacity Grid */}
          <View style={styles.section}>
            <Text style={styles.label}>Capacity</Text>
            <View style={styles.capacityGrid}>
              <View style={styles.capacityItem}>
                <Text style={styles.capacityLabel}>Guests</Text>
                <TextInput
                  value={guests}
                  onChangeText={setGuests}
                  keyboardType="number-pad"
                  style={styles.capacityInput}
                />
              </View>
              <View style={styles.capacityItem}>
                <Text style={styles.capacityLabel}>Bedrooms</Text>
                <TextInput
                  value={bedrooms}
                  onChangeText={setBedrooms}
                  keyboardType="number-pad"
                  style={styles.capacityInput}
                />
              </View>
              <View style={styles.capacityItem}>
                <Text style={styles.capacityLabel}>Bathrooms</Text>
                <TextInput
                  value={bathrooms}
                  onChangeText={setBathrooms}
                  keyboardType="number-pad"
                  style={styles.capacityInput}
                />
              </View>
              <View style={styles.capacityItem}>
                <Text style={styles.capacityLabel}>Beds</Text>
                <TextInput
                  value={beds}
                  onChangeText={setBeds}
                  keyboardType="number-pad"
                  style={styles.capacityInput}
                />
              </View>
            </View>
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.chipsRow}>
              {(['active', 'draft'] as PropertyStatus[]).map((s) => {
                const active = status === s;
                return (
                  <Pressable
                    key={s}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setStatus(s)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {s === 'active' ? 'Active' : 'Draft'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Highlights stub */}
          <View style={styles.section}>
            <Text style={styles.label}>Highlights</Text>
            <View style={styles.highlightsRow}>
              <View style={styles.highlightChip}>
                <Text style={styles.highlightChipText}>Free WiFi</Text>
              </View>
              <View style={styles.highlightChip}>
                <Text style={styles.highlightChipText}>Air Conditioning</Text>
              </View>
              <Pressable style={styles.addHighlightBtn} onPress={handleAddHighlight}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primaryDark} />
                <Text style={styles.addHighlightText}>Add Highlight</Text>
              </Pressable>
            </View>
            <Text style={styles.helper}>Highlights setup coming in a later version</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable style={styles.footerBtn} disabled>
            <Text style={[styles.footerBtnText, { color: colors.textTertiary }]}>Previous</Text>
          </Pressable>
          <NativeButton label="Save Draft" variant="secondary" onPress={handleSave} loading={saving} />
          <Pressable style={styles.footerBtn} onPress={handleNext}>
            <Text style={styles.footerBtnText}>Next</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Save FAB */}
      <Pressable style={styles.fab} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="checkmark" size={24} color="#fff" />
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

function StepIndicator({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={stepStyles.root}>
      <View style={[stepStyles.dot, active && stepStyles.dotActive]} />
      <Text style={[stepStyles.label, active && stepStyles.labelActive]}>{label}</Text>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
  label: { ...typography.caption, color: colors.textTertiary },
  labelActive: { color: colors.text, fontWeight: '600' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.title2, color: colors.text, flex: 1, textAlign: 'center' },
  activeBadge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  activeBadgeText: { ...typography.caption, fontWeight: '700', color: colors.primaryDark },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  stepper: { paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  form: { paddingTop: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.headline, color: colors.text, marginBottom: spacing.sm },
  label: { ...typography.subhead, color: colors.text, fontWeight: '600', marginBottom: spacing.sm },
  required: { color: colors.error },
  input: {
    ...typography.subhead,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  textArea: { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' },
  helper: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.footnote, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
  capacityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  capacityItem: { flex: 1, minWidth: 70 },
  capacityLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  capacityInput: {
    ...typography.subhead,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 10,
  },
  coverImage: { width: '100%', height: 200, borderRadius: radii.md, backgroundColor: colors.border },
  coverPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: radii.md,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  coverPlaceholderText: { ...typography.subhead, color: colors.textSecondary },
  highlightsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  highlightChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.primaryMuted,
  },
  highlightChipText: { ...typography.footnote, color: colors.primaryDark },
  addHighlightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addHighlightText: { ...typography.footnote, fontWeight: '600', color: colors.primaryDark },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  footerBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  footerBtnText: { ...typography.subhead, fontWeight: '600', color: colors.primaryDark },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
