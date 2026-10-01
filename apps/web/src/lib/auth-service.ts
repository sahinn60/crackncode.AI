import { apiClient, ApiError } from './api-client';
import { tokenStorage } from './token-storage';

export { ApiError };

export const authService = {
  async register(dto: { name: string; email: string; password: string }) {
    const response = await apiClient.auth.register(dto) as any;
    if (response?.user) tokenStorage.setUser(response.user);
    return response;
  },

  async login(dto: { email: string; password: string; rememberMe?: boolean }) {
    const response = await apiClient.auth.login(dto) as any;
    if (response?.user) tokenStorage.setUser(response.user);
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.auth.logout();
    } catch {
      // Always clear local state
    } finally {
      tokenStorage.clear();
    }
  },

  async getMe(): Promise<any> {
    return apiClient.auth.me();
  },

  async forgotPassword(dto: { email: string }): Promise<void> {
    await apiClient.auth.forgotPassword(dto);
  },

  async resetPassword(dto: { token: string; password: string }): Promise<void> {
    await apiClient.auth.resetPassword(dto);
  },

  async refreshToken(): Promise<boolean> {
    try {
      await apiClient.auth.refresh();
      return true;
    } catch {
      tokenStorage.clear();
      return false;
    }
  },

  getStoredUser(): any | null {
    return tokenStorage.getUser();
  },

  isAuthenticated(): boolean {
    return tokenStorage.isAuthenticated();
  },
};
