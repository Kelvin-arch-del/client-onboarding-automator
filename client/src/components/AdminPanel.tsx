import React from 'react';
import { useAuth } from '../auth/useAuth';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      <p>Welcome, {user?.name || 'Administrator'}</p>

      <div className="admin-sections">
        <div className="section">
          <h2>User Management</h2>
          <p>Manage system users and permissions</p>
        </div>

        <div className="section">
          <h2>Workflow Templates</h2>
          <p>Configure onboarding workflows</p>
        </div>

        <div className="section">
          <h2>System Settings</h2>
          <p>Configure system-wide settings</p>
        </div>

        <div className="section">
          <h2>Analytics</h2>
          <p>View system performance metrics</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
