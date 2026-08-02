import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ExploreScreen } from '@/screens/guest/ExploreScreen';
import { SavedScreen } from '@/screens/guest/SavedScreen';
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
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
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
            route.name === 'Explore'
              ? focused
                ? 'home'
                : 'home-outline'
              : route.name === 'Saved'
                ? focused
                  ? 'heart'
                  : 'heart-outline'
                : route.name === 'Trips'
                  ? focused
                    ? 'briefcase'
                    : 'briefcase-outline'
                  : route.name === 'Messages'
                    ? focused
                      ? 'chatbubble'
                      : 'chatbubble-outline'
                    : focused
                      ? 'person'
                      : 'person-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ title: 'Home', headerShown: false }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedScreen}
        options={{ title: 'Saved', headerShown: false }}
      />
      <Tab.Screen
        name="Trips"
        component={TripsScreen}
        options={{ title: 'Trips', headerShown: false }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ title: 'Messages', headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile', headerShown: false }}
      />
    </Tab.Navigator>
  );
}
