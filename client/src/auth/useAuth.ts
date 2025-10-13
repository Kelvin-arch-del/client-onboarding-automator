import { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import { AuthContextType } from './types';

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
