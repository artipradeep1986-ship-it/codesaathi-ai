import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Camera, FolderCode, BookOpen } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/scan', label: 'Scan', icon: Camera },
    { to: '/programs', label: 'Programs', icon: FolderCode },
    { to: '/learn', label: 'Learn', icon: BookOpen },
  ];

  return (
    <nav className="bottom-nav md:hidden" aria-label="Mobile Navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors select-none min-h-[48px] ${
                isActive ? 'text-primary font-bold' : 'text-text-muted hover:text-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1 rounded-full transition-transform ${
                    isActive ? 'scale-110 bg-primary-50' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="mt-0.5">{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
