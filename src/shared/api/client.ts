import { Platform } from 'react-native';
import Constants from 'expo-constants';

const DEV_PORT = 4001;

/**
 * `localhost` in dev resolves to the device itself, so it never reaches a laptop-hosted API.
 * Prefer the host the Expo dev server is already reachable on (works for emulators and
 * physical devices on the same network), then fall back to the Android emulator loopback alias.
 */
function devHostFallback(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost;
  const host = hostUri?.split('/')[0]?.split(':')[0]?.trim();

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${DEV_PORT}`;
  }

  return Platform.OS === 'android'
    ? `http://10.0.2.2:${DEV_PORT}`
    : `http://localhost:${DEV_PORT}`;
}

function isLoopback(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(url);
}

export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL?.trim()) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  const extra = Constants.expoConfig?.extra as
    | { apiBaseUrl?: string; apiBaseUrlDev?: string }
    | undefined;

  if (__DEV__) {
    const configured = extra?.apiBaseUrlDev?.replace(/\/$/, '');
    // A loopback dev URL is unreachable from a device/emulator — resolve a real host instead.
    if (configured && !isLoopback(configured)) return configured;
    return devHostFallback();
  }

  if (extra?.apiBaseUrl) {
    return extra.apiBaseUrl.replace(/\/$/, '');
  }

  return 'https://api.dwelis.com';
}
