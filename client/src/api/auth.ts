import apiClient from './config';
import { jwtDecode } from 'jwt-decode';
import { LoginResponse, RegisterResponse, User, JwtPayload, Role } from '../auth/types';

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: Role = 'Client'
): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>('/auth/register', {
    email,
    password,
    name,
    role,
  });
  return response.data;
};

export const getUserProfile = async (): Promise<User> => {
  const response = await apiClient.get<{ data: User }>('/auth/me');
  return response.data.data;
};

export const refreshToken = async (refreshToken: string): Promise<{ token: string }> => {
  const response = await apiClient.post<{ token: string }>('/auth/refresh', {
    refreshToken,
  });
  return response.data;
};

export const logoutUser = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
};
