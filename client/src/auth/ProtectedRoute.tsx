import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';

interface ProtectedRouteProps {
  redirectPath?: string;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = '/login',
  requiredRole,
}) => {
  const { isAuthenticated, hasRole } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }
  if (requiredRole && !hasRole(requiredRole as any)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
};
