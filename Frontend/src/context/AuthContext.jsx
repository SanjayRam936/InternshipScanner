import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, fetchCurrentUser } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ---- Helpers ---- */
  const getStorage = () =>
    localStorage.getItem('access_token') ? localStorage : sessionStorage;

  const storeTokens = (access, refresh, remember) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('access_token', access);
    storage.setItem('refresh_token', refresh);
  };

  const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
  };

  /* ---- Load user on mount if token exists ---- */
  const loadUser = useCallback(async () => {
    const access =
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token');

    if (!access) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await fetchCurrentUser();
      setUser(data);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  /* ---- Auth actions ---- */
  const login = async (username, password, remember = false) => {
    const { data } = await apiLogin(username, password);
    storeTokens(data.access, data.refresh, remember);
    const { data: userData } = await fetchCurrentUser();
    setUser(userData);
    return userData;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (updated) => {
    setUser((prev) => ({ ...prev, ...updated }));
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, updateUser, storeTokens }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
