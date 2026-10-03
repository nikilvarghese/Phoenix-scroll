import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService, getStoredToken, getStoredUser, storeTokenAndUser } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOwner: boolean;
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, pass: string, otp: string, role?: 'owner' | 'reader', rememberMe?: boolean, acceptedTerms?: boolean) => Promise<void>;
  googleLogin: (data: { idToken?: string; accessToken?: string; email?: string; name?: string; avatarUrl?: string }, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const fetchedUser = await authService.getMe();
          setUser(fetchedUser);
          storeTokenAndUser(token, fetchedUser, true);
        } catch (err: any) {
          if (err.response?.status === 401) {
            authService.logout();
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string, rememberMe: boolean = true) => {
    const res = await authService.login(email, pass, rememberMe);
    setUser(res.user);
  };

  const register = async (name: string, email: string, pass: string, otp: string, role: 'owner' | 'reader' = 'reader', rememberMe: boolean = true, acceptedTerms: boolean = true) => {
    const res = await authService.register(name, email, pass, otp, role, rememberMe, acceptedTerms);
    setUser(res.user);
  };

  const googleLogin = async (data: { idToken?: string; accessToken?: string; email?: string; name?: string; avatarUrl?: string }, rememberMe: boolean = true) => {
    const res = await authService.googleLogin(data, rememberMe);
    setUser(res.user);
  };

  const deleteAccount = async () => {
    await authService.deleteAccount();
    setUser(null);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isOwner = user?.role === 'owner';

  return (
    <AuthContext.Provider value={{ user, loading, isOwner, login, register, googleLogin, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
