import { apiClient } from './config';
import { ApiResponse, LoginRequest, LoginResponse, UserProfile } from './types';

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<ApiResponse<LoginResponse>>(
        '/auth/login',
        credentials
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  async getProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get<ApiResponse<UserProfile>>('/auth/me');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  },

  async refreshToken(): Promise<{ token: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ token: string }>>(
        '/auth/refresh'
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Token refresh failed');
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error: any) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error.message);
    } finally {
      localStorage.removeItem('auth_token');
    }
  },
};
