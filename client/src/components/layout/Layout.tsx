import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { Toaster } from '../ui/Toast';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  // Pages that don't need app shell (auth flows and onboarding)
  const isAuthPage = [
    '/welcome',
    '/login',
    '/signup',
    '/profile/setup',
  ].includes(location.pathname);

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-surface-soft text-text flex flex-col">
        <Toaster />
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    );
  }

  // Determine page title based on path
  const getPageTitle = (path: string) => {
    if (path === '/') return 'CodeSaathi AI';
    if (path.startsWith('/scan')) return 'Scan Handwritten Code';
    if (path.startsWith('/editor')) return 'Code Editor';
    if (path.startsWith('/programs')) return 'My Programs';
    if (path.startsWith('/learn')) return 'Learn Java';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/admin')) return 'Admin Dashboard';
    return undefined;
  };

  const title = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 text-text flex flex-col md:flex-row">
      <Toaster />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-6">
        <TopBar title={title} />
        <main className="flex-1 p-4 md:p-6 max-w-5xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
