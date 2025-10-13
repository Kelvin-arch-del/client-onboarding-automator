import React from 'react';
import { useAuth } from '../auth/useAuth';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between bg-white border-b px-4 py-2">
      <button
        className="md:hidden text-gray-600"
        onClick={() => {
          // toggle mobile sidebar (implementation omitted)
        }}
      >
        ☰
      </button>
      <div className="text-lg font-semibold">Dashboard</div>
      <div className="flex items-center space-x-4">
        <span className="text-gray-700">{user?.email}</span>
        <button
          onClick={logout}
          className="text-sm text-red-600 hover:underline"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
