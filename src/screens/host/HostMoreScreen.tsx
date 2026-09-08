import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HostHeader } from '@/components/host/HostHeader';
import { useAuth } from '@/shared/context/AuthContext';
import type { HostTabParamList, RootStackParamList } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<HostTabParamList, 'More'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type MenuRow = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
};

function Section({ title, rows }: { title: string; rows: MenuRow[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {rows.map((row, index) => (
          <Pressable
            key={row.key}
            onPress={row.onPress}
            style={({ pressed }) => [
              styles.row,
              index < rows.length - 1 && styles.rowBorder,
              pressed && styles.rowPressed,
            ]}
          >
            <View style={[styles.iconWrap, row.destructive && styles.iconWrapDanger]}>
              <Ionicons
                name={row.icon}
                size={18}
                color={row.destructive ? colors.error : colors.primaryDark}
              />
            </View>
            <Text style={[styles.rowLabel, row.destructive && styles.rowLabelDanger]}>{row.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function HostMoreScreen() {
  const navigation = useNavigation<Nav>();
  const { switchRole, logout } = useAuth();

  const manageRows: MenuRow[] = [
    {
      key: 'properties',
      label: 'Properties',
      icon: 'home-outline',
      onPress: () => navigation.navigate('HostProperties'),
    },
    {
      key: 'guests',
      label: 'Guests',
      icon: 'people-outline',
      onPress: () => navigation.navigate('HostGuests'),
    },
    {
      key: 'calendar-sync',
      label: 'Calendar Sync',
      icon: 'sync-outline',
      onPress: () => Alert.alert('Calendar Sync', 'Calendar sync is coming soon.'),
    },
  ];

  const accountRows: MenuRow[] = [
    {
      key: 'guest-mode',
      label: 'Switch to Guest mode',
      icon: 'swap-horizontal-outline',
      onPress: () => void switchRole('traveller'),
    },
    {
      key: 'sign-out',
      label: 'Sign Out',
      icon: 'log-out-outline',
      destructive: true,
      onPress: () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: () => void logout() },
        ]);
      },
    },
  ];

  return (
    <View style={styles.root}>
      <HostHeader title="More" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Manage" rows={manageRows} />
        <Section title="Account" rows={accountRows} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionTitle: {
    ...typography.footnote,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.primarySoft },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDanger: { backgroundColor: 'rgba(240, 68, 56, 0.12)' },
  rowLabel: { ...typography.callout, color: colors.text, flex: 1, fontWeight: '500' },
  rowLabelDanger: { color: colors.error },
});
