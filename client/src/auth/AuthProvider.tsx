import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, decodeToken, isTokenExpired, refreshToken } from '../api/auth';
import { AuthContextType, JwtPayload, Role, ROLE_PERMISSIONS } from './types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const logout = useCallback((): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
    setError(null);
    navigate('/login');
  }, [navigate]);

  const initializeAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (storedToken) {
      try {
        if (isTokenExpired(storedToken)) {
          if (storedRefreshToken) {
            try {
              const { token: newToken } = await refreshToken(storedRefreshToken);
              localStorage.setItem('token', newToken);
              setToken(newToken);
              const decoded = decodeToken(newToken);
              setUser(decoded);
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              logout();
            }
          } else {
            logout();
          }
        } else {
          const decoded = decodeToken(storedToken);
          if (decoded) {
            setToken(storedToken);
            setUser(decoded);
          } else {
            logout();
          }
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
        logout();
      }
    }
    setIsLoading(false);
  }, [logout]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await loginUser(email, password);

      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);

      const decoded = decodeToken(response.token);
      if (decoded) {
        setToken(response.token);
        setUser(decoded);
        navigate('/');
      } else {
        throw new Error('Invalid token received');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: Role = 'Client'
  ): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await registerUser(email, password, name, role);

      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);

      const decoded = decodeToken(response.token);
      if (decoded) {
        setToken(response.token);
        setUser(decoded);
        navigate('/');
      } else {
        throw new Error('Invalid token received');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = useCallback(
    (role: Role): boolean => {
      return user?.roles?.includes(role) ?? false;
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user?.roles) return false;

      return user.roles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission) ?? false);
    },
    [user]
  );

  const isAuthenticated = useMemo(() => {
    return !!token && !!user && !isTokenExpired(token);
  }, [token, user]);

  const contextValue = useMemo(
    () => ({
      token,
      user,
      login,
      logout,
      register,
      isAuthenticated,
      hasRole,
      hasPermission,
      isLoading,
      error,
    }),
    [token, user, isAuthenticated, hasRole, hasPermission, isLoading, error, logout]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
