import React from 'react';
import { useAuth } from '../auth/useAuth';
import { Role } from '../auth/types';

interface RoleBasedComponentProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requiredPermission?: string;
  fallback?: React.ReactNode;
}

const RoleBasedComponent: React.FC<RoleBasedComponentProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  fallback = null,
}) => {
  const { hasRole, hasPermission } = useAuth();

  // Check role-based access
  if (allowedRoles && !allowedRoles.some((role) => hasRole(role))) {
    return <>{fallback}</>;
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleBasedComponent;
