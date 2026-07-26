import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type AppStateStatus } from 'react-native';
import { getApiBaseUrl } from '../api/client';
import { normalizeIdentifierForLogin } from '../utils/phone';
import { registerForPushNotifications, unregisterPushToken } from '../services/pushNotifications.service';

const AUTH_STORAGE_KEY = '@ghana_shortlet_auth';

export type User = {
  id: string;
  email?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  fullName?: string;
  role: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
};

export type ActiveRole = 'traveller' | 'host';

export type SignupParams = {
  email?: string;
  phoneNumber?: string;
  password: string;
  fullName?: string;
  role?: 'traveller' | 'host';
};

export type SignupResult =
  | { user: User }
  | { needsVerification: true; email: string }
  | { needsPhoneVerification: true; phoneNumber: string };

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  roles: string[];
  activeRole: ActiveRole;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (params: SignupParams) => Promise<SignupResult>;
  verifyEmailWithCode: (email: string, code: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ sent: boolean; alreadyVerified?: boolean }>;
  verifyPhoneWithCode: (phoneNumber: string, code: string) => Promise<void>;
  resendPhoneVerification: (
    phoneNumber: string,
  ) => Promise<{ sent: boolean; alreadyVerified?: boolean }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  fetchRoles: () => Promise<string[]>;
  switchRole: (role: ActiveRole) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const api = axios.create({
  baseURL: getApiBaseUrl(),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>(['traveller']);
  const [activeRole, setActiveRole] = useState<ActiveRole>('traveller');
  const tokenRef = useRef<string | null>(null);
  const activeRoleRef = useRef<ActiveRole>(activeRole);

  useEffect(() => {
    activeRoleRef.current = activeRole;
  }, [activeRole]);

  const persistAuth = useCallback(
    async (accessToken: string, refreshToken: string, userData: User, preferredRole?: ActiveRole) => {
      tokenRef.current = accessToken;
      setToken(accessToken);
      setUser(userData);
      if (preferredRole) setActiveRole(preferredRole);
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          accessToken,
          refreshToken,
          user: userData,
          preferredRole: preferredRole ?? activeRoleRef.current,
        }),
      );
    },
    [],
  );

  const clearAuth = useCallback(async () => {
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    setRoles(['traveller']);
    setActiveRole('traveller');
    delete api.defaults.headers.common.Authorization;
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return false;
      const { refreshToken: storedRefresh } = JSON.parse(raw);
      if (!storedRefresh) return false;
      const res = await api.post('/auth/refresh', { refreshToken: storedRefresh });
      const { accessToken, refreshToken, user: userData } = res.data;
      await persistAuth(accessToken, refreshToken, userData);
      return true;
    } catch {
      await clearAuth();
      return false;
    }
  }, [persistAuth, clearAuth]);

  const fetchRoles = useCallback(async (): Promise<string[]> => {
    try {
      const res = await api.get<{ roles: string[] }>('/users/roles');
      const list = res.data?.roles ?? ['traveller'];
      setRoles(list);
      return list;
    } catch {
      setRoles(['traveller']);
      return ['traveller'];
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<User>('/users/me');
      const userData = res.data;
      if (userData) {
        setUser(userData);
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw);
          stored.user = userData;
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const switchRole = useCallback(async (role: ActiveRole) => {
    setActiveRole(role);
    try {
      await api.post('/users/switch-role', { role });
    } catch {
      /* ignore */
    }
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      data.preferredRole = role;
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    tokenRef.current = token;
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (res) => res,
      async (err) => {
        const original = err.config;
        const isRefreshRequest = original?.url?.includes('/auth/refresh');
        if (err?.response?.status === 401 && !original._retry && !isRefreshRequest) {
          original._retry = true;
          const ok = await refreshAuth();
          if (ok) {
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${tokenRef.current}`;
            return api(original);
          }
          await clearAuth();
        }
        return Promise.reject(err);
      },
    );
    return () => api.interceptors.response.eject(interceptorId);
  }, [refreshAuth, clearAuth]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (cancelled || !raw) return;

        const { accessToken, refreshToken, user: storedUser, preferredRole } = JSON.parse(raw);
        if (accessToken && storedUser) {
          tokenRef.current = accessToken;
          setToken(accessToken);
          setUser(storedUser);
          if (preferredRole === 'host' || preferredRole === 'traveller') {
            setActiveRole(preferredRole);
          }
          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          if (refreshToken) {
            const ok = await refreshAuth();
            if (!ok) {
              await clearAuth();
              return;
            }
          }
          if (!cancelled && tokenRef.current) await fetchRoles();
        }
      } catch {
        if (!cancelled) await clearAuth();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshAuth, clearAuth, fetchRoles]);

  useEffect(() => {
    const onAppState = async (state: AppStateStatus) => {
      if (state !== 'active' || !tokenRef.current) return;
      try {
        await refreshAuth();
      } catch {
        /* refreshAuth clears auth on failure */
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [refreshAuth]);

  useEffect(() => {
    if (!token) return;
    void registerForPushNotifications(api);
  }, [token]);

  const login = async (identifier: string, password: string) => {
    const res = await api.post('/auth/login', {
      identifier: normalizeIdentifierForLogin(identifier),
      password,
    });
    const { accessToken, refreshToken, user: userData } = res.data;
    await persistAuth(accessToken, refreshToken, userData);
    await fetchRoles();
  };

  const signup = async (params: SignupParams): Promise<SignupResult> => {
    const payload: Record<string, string> = {
      password: params.password,
      fullName: params.fullName ?? '',
    };
    if (params.email?.trim()) payload.email = params.email.trim();
    if (params.phoneNumber?.trim()) payload.phoneNumber = params.phoneNumber.trim();
    if (params.role) payload.role = params.role;

    const res = await api.post('/auth/signup', payload);
    if (res.data.needsVerification) {
      return { needsVerification: true, email: String(res.data.email ?? params.email ?? '') };
    }
    if (res.data.needsPhoneVerification) {
      return {
        needsPhoneVerification: true,
        phoneNumber: String(res.data.phoneNumber ?? params.phoneNumber ?? ''),
      };
    }
    const { accessToken, refreshToken, user: userData } = res.data;
    await persistAuth(accessToken, refreshToken, userData);
    await fetchRoles();
    return { user: userData };
  };

  const verifyEmailWithCode = async (email: string, code: string) => {
    const res = await api.post('/auth/verify-email-with-code', { email, code });
    const { accessToken, refreshToken, user: userData } = res.data;
    await persistAuth(accessToken, refreshToken, userData);
    await fetchRoles();
  };

  const resendVerificationEmail = async (email: string) => {
    const res = await api.post<{ sent: boolean; alreadyVerified?: boolean }>(
      '/auth/resend-verification-email',
      { email },
    );
    return res.data;
  };

  const verifyPhoneWithCode = async (phoneNumber: string, code: string) => {
    const res = await api.post('/auth/verify-phone-with-code', { phoneNumber, code });
    const { accessToken, refreshToken, user: userData } = res.data;
    await persistAuth(accessToken, refreshToken, userData);
    await fetchRoles();
  };

  const resendPhoneVerification = async (phoneNumber: string) => {
    const res = await api.post<{ sent: boolean; alreadyVerified?: boolean }>(
      '/auth/resend-phone-verification',
      { phoneNumber },
    );
    return res.data;
  };

  const logout = async () => {
    try {
      await unregisterPushToken(api);
    } catch {
      /* ignore */
    }
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const { refreshToken: rt } = JSON.parse(raw);
        if (rt) await api.post('/auth/logout', { refreshToken: rt });
      }
    } catch {
      /* ignore */
    }
    await clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        roles,
        activeRole,
        login,
        signup,
        verifyEmailWithCode,
        resendVerificationEmail,
        verifyPhoneWithCode,
        resendPhoneVerification,
        logout,
        refreshAuth,
        refreshUser,
        fetchRoles,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
