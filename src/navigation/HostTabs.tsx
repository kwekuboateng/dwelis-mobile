import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HostTodayScreen } from '@/screens/host/HostTodayScreen';
import { HostListingsScreen } from '@/screens/host/HostListingsScreen';
import { HostCalendarScreen } from '@/screens/host/HostCalendarScreen';
import { HostMoreScreen } from '@/screens/host/HostMoreScreen';
import { colors, typography } from '@/theme';
import type { HostTabParamList } from './types';

const Tab = createBottomTabNavigator<HostTabParamList>();

export function HostTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerLargeTitle: Platform.OS === 'ios',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { ...typography.caption, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const icon =
            route.name === 'Today'
              ? focused
                ? 'today'
                : 'today-outline'
              : route.name === 'Listings'
                ? focused
                  ? 'home'
                  : 'home-outline'
                : route.name === 'Calendar'
                  ? focused
                    ? 'calendar'
                    : 'calendar-outline'
                  : focused
                    ? 'grid'
                    : 'grid-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Today" component={HostTodayScreen} options={{ title: 'Today' }} />
      <Tab.Screen name="Listings" component={HostListingsScreen} options={{ title: 'Listings' }} />
      <Tab.Screen name="Calendar" component={HostCalendarScreen} options={{ title: 'Calendar' }} />
      <Tab.Screen name="More" component={HostMoreScreen} options={{ title: 'More' }} />
    </Tab.Navigator>
  );
}
