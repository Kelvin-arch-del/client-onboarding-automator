import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'Upload Documents', to: '/upload' },
  { name: 'Documents', to: '/documents' },
  { name: 'Onboarding Progress', to: '/onboarding-progress' },
  { name: 'Notifications', to: '/notifications' },
];

const Sidebar: React.FC = () => (
  <aside className="w-64 bg-white border-r hidden md:flex md:flex-col">
    <div className="p-6 text-xl font-bold">Client Portal</div>
    <nav className="flex-1 px-4 space-y-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({
            isActive,
            }: {
            isActive: boolean;
            isPending: boolean; // optional, if you want pending state
            }) =>
            `block px-4 py-2 rounded hover:bg-gray-200 ${
                isActive ? 'bg-gray-200 font-semibold' : ''
            }`
            }
          
        >
          {item.name}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default Sidebar;
