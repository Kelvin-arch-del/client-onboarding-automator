import React from 'react';
import NotificationsPanel from './NotificationsPanel';

const Dashboard: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div className="lg:col-span-2 bg-white border rounded p-4 shadow-sm">
      <h1 className="text-2xl font-bold mb-4">Welcome to Your Dashboard</h1>
      <p className="text-gray-700">Use the sidebar to navigate through your onboarding process.</p>
    </div>
    <NotificationsPanel />
  </div>
);

export default Dashboard;
