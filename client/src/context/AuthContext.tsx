import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { AuthSessionUser, UserRole } from '../types';
import { useToast } from '../components/common/Toast';

interface AuthContextType {
  user: AuthSessionUser | null;
  role: UserRole | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: (notice?: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Logout handler
  const logout = useCallback(async (notice?: string) => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (notice) {
        showToast('info', notice);
      }
    }
  }, [showToast]);

  // Load current session from server on startup
  useEffect(() => {
    let mounted = true;
    api
      .getMe()
      .then((res) => {
        if (mounted) {
          setUser(res.user);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Listen for global auth events dispatched by api.ts
  useEffect(() => {
    const handleUnauthorized = (e: Event) => {
      const customEvent = e as CustomEvent;
      logout(customEvent.detail || 'Session expired. Please sign in again.');
    };

    const handleForbidden = (e: Event) => {
      const customEvent = e as CustomEvent;
      showToast('error', customEvent.detail || 'You do not have permission to do that.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:forbidden', handleForbidden);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:forbidden', handleForbidden);
    };
  }, [logout, showToast]);

  // 30-minute Idle Timeout
  useEffect(() => {
    if (!user) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        logout('Session expired due to 30 minutes of inactivity.');
      }, IDLE_TIMEOUT_MS);
    };

    // Track user interaction
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { passive: true }));

    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
    };
  }, [user, logout]);

  const login = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    setUser(res.user);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.changePassword({ currentPassword, newPassword });
    showToast('success', 'Password successfully updated.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        loading,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
