import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HostOverviewScreen } from '../screens/host/HostOverviewScreen';
import { HostCalendarScreen } from '../screens/host/HostCalendarScreen';
import { HostBookingsScreen } from '../screens/host/HostBookingsScreen';
import { HostMessagesScreen } from '../screens/host/HostMessagesScreen';
import { HostMoreScreen } from '../screens/host/HostMoreScreen';
import { colors, typography } from '@/theme';
import type { HostTabParamList } from './types';

const Tab = createBottomTabNavigator<HostTabParamList>();

export function HostTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { ...typography.caption, fontWeight: '600' },
        tabBarStyle: Platform.select({
          ios: {
            backgroundColor: 'rgba(255,255,255,0.94)',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
          },
          android: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 64,
            paddingBottom: 8,
          },
        }),
        tabBarIcon: ({ color, size, focused }) => {
          const icon =
            route.name === 'Overview'
              ? focused
                ? 'home'
                : 'home-outline'
              : route.name === 'Calendar'
                ? focused
                  ? 'calendar'
                  : 'calendar-outline'
                : route.name === 'Bookings'
                  ? focused
                    ? 'briefcase'
                    : 'briefcase-outline'
                  : route.name === 'Messages'
                    ? focused
                      ? 'chatbubbles'
                      : 'chatbubbles-outline'
                    : focused
                      ? 'grid'
                      : 'grid-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Overview" component={HostOverviewScreen} options={{ title: 'Overview' }} />
      <Tab.Screen name="Calendar" component={HostCalendarScreen} options={{ title: 'Calendar' }} />
      <Tab.Screen name="Bookings" component={HostBookingsScreen} options={{ title: 'Bookings' }} />
      <Tab.Screen name="Messages" component={HostMessagesScreen} options={{ title: 'Messages' }} />
      <Tab.Screen name="More" component={HostMoreScreen} options={{ title: 'More' }} />
    </Tab.Navigator>
  );
}
