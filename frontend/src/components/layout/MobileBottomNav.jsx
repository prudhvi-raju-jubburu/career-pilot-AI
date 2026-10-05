import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Layers,
  TrendingUp,
  User
} from 'lucide-react';

export default function MobileBottomNav() {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Opportunities', path: '/opportunities', icon: Briefcase },
    { label: 'Applications', path: '/applications', icon: Layers },
    { label: 'Skill Gap', path: '/skill-gap', icon: TrendingUp },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
            title={item.label}
          >
            <div className="mobile-nav-icon-wrapper">
              <IconComponent size={19} />
            </div>
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
