// Tokens are stored in httpOnly cookies by the server.
// We only store the user profile in memory for fast access.

const USER_KEY = 'cnc_user_profile';

function isClient() {
  return typeof window !== 'undefined';
}

export const tokenStorage = {
  // Not used — server sets httpOnly cookies
  getAccessToken(): string | null { return null; },
  setAccessToken(_token: string, _persist = true): void {},
  getRefreshToken(): string | null { return null; },
  setRefreshToken(_token: string): void {},

  getUser<T>(): T | null {
    if (!isClient()) return null;
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  setUser<T>(user: T, _persist = true): void {
    if (!isClient()) return;
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear(): void {
    if (!isClient()) return;
    sessionStorage.removeItem(USER_KEY);
  },

  isAuthenticated(): boolean {
    // Check if user profile exists in session — actual auth is validated server-side
    return !!this.getUser();
  },
};
