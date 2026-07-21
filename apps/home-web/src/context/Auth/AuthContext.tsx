import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authService, User } from '../../services/auth/AuthService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (returnUrl?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Re-enable auth check and subscription
    const checkAuth = async () => {
      await authService.checkSession();
      // The subscription will handle setting the user, but we need to set loading to false
      // after the initial check is complete.
      setLoading(false);
    };
    checkAuth();

    const unsubscribe = authService.subscribe((u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Check for return URL if authenticated
    if (user) {
      const returnUrl = localStorage.getItem('auth_return_url');
      if (returnUrl) {
        localStorage.removeItem('auth_return_url');
        window.location.href = returnUrl;
      }
    }
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login: (returnUrl?: string) => authService.login(returnUrl),
      logout: () => authService.logout(),
      hasChecked: !loading, // expose loading state if needed
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
