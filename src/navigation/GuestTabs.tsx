import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ExploreScreen } from '@/screens/guest/ExploreScreen';
import { TripsScreen } from '@/screens/guest/TripsScreen';
import { MessagesScreen } from '@/screens/guest/MessagesScreen';
import { ProfileScreen } from '@/screens/guest/ProfileScreen';
import { colors, typography } from '@/theme';
import type { GuestTabParamList } from './types';

const Tab = createBottomTabNavigator<GuestTabParamList>();

export function GuestTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerLargeTitle: Platform.OS === 'ios',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { ...typography.caption, fontWeight: '600' },
        tabBarStyle: Platform.select({
          ios: {
            backgroundColor: 'rgba(255,255,255,0.94)',
            borderTopWidth: 0,
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
            route.name === 'Explore'
              ? focused
                ? 'search'
                : 'search-outline'
              : route.name === 'Trips'
                ? focused
                  ? 'airplane'
                  : 'airplane-outline'
                : route.name === 'Messages'
                  ? focused
                    ? 'chatbubbles'
                    : 'chatbubbles-outline'
                  : focused
                    ? 'person'
                    : 'person-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: 'Explore' }} />
      <Tab.Screen name="Trips" component={TripsScreen} options={{ title: 'Trips' }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
