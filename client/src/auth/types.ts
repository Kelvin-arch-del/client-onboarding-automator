export type Role = 'Admin' | 'Manager' | 'Worker' | 'Client';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  name: string;
  roles: Role[];
  exp: number; // epoch seconds
  iat: number; // epoch seconds
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface RegisterResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface AuthContextType {
  token: string | null;
  user: JwtPayload | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string, role?: Role) => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: Role) => boolean;
  hasPermission: (permission: string) => boolean;
  isLoading: boolean;
  error: string | null;
}

// Permission mappings for each role
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  Admin: [
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'client:create',
    'client:read',
    'client:update',
    'client:delete',
    'document:create',
    'document:read',
    'document:update',
    'document:delete',
    'document:approve',
    'document:reject',
    'onboarding:create',
    'onboarding:read',
    'onboarding:update',
    'onboarding:delete',
    'onboarding:approve',
    'onboarding:assign',
    'analytics:read',
    'settings:read',
    'settings:update',
  ],
  Manager: [
    'client:create',
    'client:read',
    'client:update',
    'document:read',
    'document:approve',
    'document:reject',
    'onboarding:create',
    'onboarding:read',
    'onboarding:update',
    'onboarding:assign',
    'analytics:read',
    'user:read',
  ],
  Worker: [
    'client:read',
    'client:update',
    'document:read',
    'document:create',
    'document:update',
    'onboarding:read',
    'onboarding:update',
  ],
  Client: ['document:create', 'document:read', 'onboarding:read', 'profile:read', 'profile:update'],
};
