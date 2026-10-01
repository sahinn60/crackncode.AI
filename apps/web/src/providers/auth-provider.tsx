'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { authService, ApiError } from '@/lib/auth-service';
import { tokenStorage } from '@/lib/token-storage';

interface AuthContextValue {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dto: { email: string; password: string; rememberMe?: boolean }) => Promise<void>;
  register: (dto: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (dto: { email: string }) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Rehydrate from storage on mount
  React.useEffect(() => {
    const stored = authService.getStoredUser();
    if (stored && authService.isAuthenticated()) {
      setUser(stored);
      // Silently refresh user data from server
      authService.getMe()
        .then(setUser)
        .catch(async () => {
          // Try token refresh before giving up
          const refreshed = await authService.refreshToken();
          if (refreshed) {
            authService.getMe().then(setUser).catch(() => {
              authService.logout().then(() => setUser(null));
            });
          } else {
            authService.logout().then(() => setUser(null));
          }
        });
    }
    setIsLoading(false);
  }, []);

  const login = React.useCallback(async (dto: { email: string; password: string; rememberMe?: boolean }) => {
    const response = await authService.login(dto);
    setUser(response.user);
    router.push('/dashboard');
  }, [router]);

  const register = React.useCallback(async (dto: { name: string; email: string; password: string }) => {
    const response = await authService.register(dto);
    setUser(response.user);
    router.push('/dashboard');
  }, [router]);

  const logout = React.useCallback(async () => {
    await authService.logout();
    setUser(null);
    router.push('/login');
  }, [router]);

  const forgotPassword = React.useCallback(async (dto: { email: string }) => {
    await authService.forgotPassword(dto);
  }, []);

  const resetPassword = React.useCallback(async (token: string, password: string) => {
    await authService.resetPassword({ token, password });
    router.push('/login');
  }, [router]);

  const refreshUser = React.useCallback(async () => {
    const fresh = await authService.getMe();
    setUser(fresh);
    tokenStorage.setUser(fresh, true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };
