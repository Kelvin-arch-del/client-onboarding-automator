export type Role = 'Admin' | 'Manager' | 'Worker' | 'Client';

export interface JwtPayload {
  sub: string;                // user ID
  email: string;
  roles: Role[];
  exp: number;                // epoch seconds
  iat: number;                // epoch seconds
}

export interface AuthContextType {
  token: string | null;
  user: JwtPayload | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: Role) => boolean;
  hasPermission: (permission: string) => boolean;
}
