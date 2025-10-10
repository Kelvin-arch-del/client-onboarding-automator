import axios, { AxiosResponse } from 'axios';
import { LoginCredentials, AuthResponse, User } from '../types/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class AuthService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/api/auth`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshed = await this.refreshToken();
            if (refreshed) {
              const newToken = localStorage.getItem('auth_token');
              if (newToken && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearAuthData();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/login', credentials);
      
      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data;
        this.setAuthData(token, user);
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) return false;

      const response: AxiosResponse<AuthResponse> = await this.api.post('/refresh', {
        refreshToken
      });

      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data;
        this.setAuthData(token, user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response: AxiosResponse<{ user: User }> = await this.api.get('/me');
      return response.data.user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  logout(): void {
    this.clearAuthData();
  }

  private setAuthData(token: string, user: User): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('refresh_token');
  }
}

export const authService = new AuthService();
