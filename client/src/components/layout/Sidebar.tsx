import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Camera,
  Code2,
  FolderCode,
  BookOpen,
  Settings,
  ShieldAlert,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Sidebar: React.FC = () => {
  const { profile, isAdmin, signOut } = useAuth();

  const navLinks = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/scan', label: 'Scan Notebook', icon: Camera },
    { to: '/editor', label: 'Code Editor', icon: Code2 },
    { to: '/programs', label: 'My Programs', icon: FolderCode },
    { to: '/learn', label: 'Learn Java', icon: BookOpen },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-white h-screen sticky top-0 shrink-0">
      {/* Brand Logo */}
      <div className="h-16 px-6 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-btn bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
          CS
        </div>
        <div>
          <span className="font-extrabold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block leading-tight">
            CodeSaathi AI
          </span>
          <span className="text-[10px] text-text-muted font-medium">Notebook to Output</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-btn text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-xs font-semibold'
                    : 'text-text-secondary hover:bg-surface-soft hover:text-text'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-3 rounded-btn text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-600 text-white shadow-xs font-semibold'
                  : 'text-amber-600 hover:bg-amber-50'
              }`
            }
          >
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>Admin Dashboard</span>
          </NavLink>
        )}
      </nav>

      {/* User Profile Info Footer */}
      <div className="p-4 border-t border-border bg-surface-soft/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary-50 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              {profile?.display_name ? (
                profile.display_name.charAt(0).toUpperCase()
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text truncate">
                {profile?.display_name || 'Student'}
              </p>
              <p className="text-xs text-text-muted truncate">
                Class {profile?.class_level || 10} • {profile?.education_board || 'ICSE'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut()}
            className="p-2 text-text-muted hover:text-error hover:bg-white rounded-btn transition-colors shrink-0"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
