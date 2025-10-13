import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { AuthContextType, JwtPayload, Role } from './types';
import { authApi } from '../api/auth';
import { UserProfile } from '../api/types';

const AUTH_TOKEN_KEY = 'auth_token';

export const AuthContext = createContext<AuthContextType | null>(null);

interface Props {
  children: ReactNode;
}

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(AUTH_TOKEN_KEY)
  );
  const [user, setUser] = useState<JwtPayload | null>(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!storedToken) return null;
    try {
      return jwtDecode<JwtPayload>(storedToken);
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(
    token && user && Date.now() / 1000 < user.exp
  );

  const saveToken = useCallback((newToken: string | null) => {
    setError(null);
    if (newToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, newToken);
      setToken(newToken);
      try {
        setUser(jwtDecode<JwtPayload>(newToken));
      } catch (error) {
        console.error('Failed to decode JWT:', error);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authApi.login({ email, password });
        saveToken(response.token);
        navigate('/', { replace: true });
      } catch (error: any) {
        setError(error.message);
        saveToken(null);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [navigate, saveToken]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      saveToken(null);
      setLoading(false);
      navigate('/login', { replace: true });
    }
  }, [navigate, saveToken]);

  const refreshUserProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const profile = await authApi.getProfile();
      // Update user data if needed
      setUser(prev => prev ? { ...prev, email: profile.email } : null);
    } catch (error) {
      console.warn('Failed to refresh user profile:', error);
    }
  }, [isAuthenticated]);

  // Auto-logout on token expiry
  useEffect(() => {
    if (!user) return;
    const expiresInMs = user.exp * 1000 - Date.now();
    if (expiresInMs <= 0) {
      logout();
    } else {
      const timeout = setTimeout(logout, expiresInMs);
      return () => clearTimeout(timeout);
    }
  }, [user, logout]);

  const hasRole = useCallback(
    (role: Role) => user?.roles.includes(role) ?? false,
    [user]
  );

  const hasPermission = useCallback(
    (permission: string) => {
      return user?.roles.includes(permission as Role) ?? false;
    },
    [user]
  );

  const contextValue: AuthContextType & {
    loading: boolean;
    error: string | null;
    refreshUserProfile: () => Promise<void>;
  } = {
    token,
    user,
    login,
    logout,
    isAuthenticated,
    hasRole,
    hasPermission,
    loading,
    error,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
