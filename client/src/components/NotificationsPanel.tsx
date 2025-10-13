import React from 'react';

const NotificationsPanel: React.FC = () => (
  <section className="bg-white border rounded p-4 shadow-sm">
    <h2 className="text-lg font-semibold mb-2">Notifications</h2>
    <ul className="space-y-2 text-gray-600">
      <li>No new notifications.</li>
      {/* Replace with dynamic notifications */}
    </ul>
  </section>
);

export default NotificationsPanel;
