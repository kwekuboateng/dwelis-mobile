import Constants from 'expo-constants';

export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL?.trim()) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  const extra = Constants.expoConfig?.extra as
    | { apiBaseUrl?: string; apiBaseUrlDev?: string }
    | undefined;

  if (__DEV__ && extra?.apiBaseUrlDev) {
    return extra.apiBaseUrlDev.replace(/\/$/, '');
  }
  if (extra?.apiBaseUrl) {
    return extra.apiBaseUrl.replace(/\/$/, '');
  }

  return __DEV__ ? 'http://localhost:4001' : 'https://api.dwelis.com';
}
