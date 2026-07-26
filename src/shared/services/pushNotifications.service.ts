import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { AxiosInstance } from 'axios';

const PUSH_TOKEN_KEY = '@dwelis_mobile_push_token';

export type PushNotificationPayload = {
  type?: string;
  screen?: string;
  bookingId?: string;
  inquiryId?: string;
  inquiryListingId?: string;
  listingId?: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function getExpoProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Dwelis',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#5DD3B6',
  });
}

/** Synced from dwelis-frontend/app/services/pushNotifications.service.ts (mobile-only). */
export async function registerForPushNotifications(api: AxiosInstance): Promise<string | null> {
  await ensureAndroidChannel();

  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId = getExpoProjectId();
  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  const token = tokenResponse.data?.trim();
  if (!token) return null;

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  await api.post('/push-tokens', { token, platform });
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  return token;
}

export async function unregisterPushToken(api: AxiosInstance): Promise<void> {
  const token = (await AsyncStorage.getItem(PUSH_TOKEN_KEY))?.trim();
  if (!token) return;

  try {
    await api.delete('/push-tokens', { data: { token } });
  } catch {
    /* ignore network errors on logout */
  }
  await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
}

export function parsePushNotificationData(
  raw: Record<string, unknown> | undefined,
): PushNotificationPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    type: typeof raw.type === 'string' ? raw.type : undefined,
    screen: typeof raw.screen === 'string' ? raw.screen : undefined,
    bookingId: typeof raw.bookingId === 'string' ? raw.bookingId : undefined,
    inquiryId: typeof raw.inquiryId === 'string' ? raw.inquiryId : undefined,
    inquiryListingId:
      typeof raw.inquiryListingId === 'string' ? raw.inquiryListingId : undefined,
    listingId: typeof raw.listingId === 'string' ? raw.listingId : undefined,
  };
}
