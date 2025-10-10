import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/auth';

const Dashboard: React.FC = () => {
  const { user, logout, hasRole, canAccess } = useAuth();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
        <button 
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hasRole(UserRole.ADMIN) && (
          <div className="p-4 bg-blue-100 rounded">
            <h3 className="font-bold">Admin Panel</h3>
            <p>Admin-only content</p>
          </div>
        )}

        {canAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
          <div className="p-4 bg-green-100 rounded">
            <h3 className="font-bold">Management Tools</h3>
            <p>Manager and Admin content</p>
          </div>
        )}

        <div className="p-4 bg-gray-100 rounded">
          <h3 className="font-bold">General Content</h3>
          <p>Available to all authenticated users</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
