import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/shared/context/AuthContext';
import { GuestTabs } from './GuestTabs';
import { HostTabs } from './HostTabs';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { SignupScreen } from '@/screens/auth/SignupScreen';
import { VerifyEmailScreen } from '@/screens/auth/VerifyEmailScreen';
import { VerifyPhoneScreen } from '@/screens/auth/VerifyPhoneScreen';
import { ListingDetailScreen } from '@/screens/guest/ListingDetailScreen';
import { ChatThreadScreen } from '@/screens/guest/ChatThreadScreen';
import {
  BrowseCityStaysScreen,
  HandpickedCollectionScreen,
  SearchResultsScreen,
} from '@/screens/guest/DiscoveryScreens';
import { colors } from '@/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isLoading, token, activeRole } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const mainRoute = !token ? 'Login' : activeRole === 'host' ? 'HostTabs' : 'GuestTabs';

  return (
    <Stack.Navigator
      key={mainRoute}
      screenOptions={{
        headerShown: true,
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        animation: 'default',
      }}
    >
      {mainRoute === 'Login' ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="VerifyEmail"
            component={VerifyEmailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VerifyPhone"
            component={VerifyPhoneScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : mainRoute === 'HostTabs' ? (
        <Stack.Screen name="HostTabs" component={HostTabs} options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="GuestTabs" component={GuestTabs} options={{ headerShown: false }} />
      )}
      <Stack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ headerShown: false, presentation: 'card' }}
      />
      <Stack.Screen
        name="HandpickedCollection"
        component={HandpickedCollectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BrowseCityStays"
        component={BrowseCityStaysScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SearchResults"
        component={SearchResultsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatThread"
        component={ChatThreadScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
