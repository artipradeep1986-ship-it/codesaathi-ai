import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, User, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  showBack,
  onBack,
  actions,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, isAdmin } = useAuth();

  // Auto-determine if back button should show (e.g. sub-pages like /editor/:id or /programs/:id or /learn/:id)
  const isRootPage = ['/', '/scan', '/programs', '/learn'].includes(location.pathname);
  const shouldShowBack = showBack !== undefined ? showBack : !isRootPage;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-border px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {shouldShowBack && (
          <button
            type="button"
            onClick={handleBack}
            className="p-2 text-text-secondary hover:text-text hover:bg-slate-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -ml-1"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          {title ? (
            <h1 className="text-lg md:text-xl font-bold text-text truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {title}
            </h1>
          ) : (
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                CodeSaathi AI
              </span>
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actions}

        {isAdmin && (
          <Link
            to="/admin"
            className="p-2 text-amber-600 hover:bg-amber-50 rounded-btn transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Admin Dashboard"
          >
            <ShieldAlert className="w-5 h-5" />
          </Link>
        )}

        <Link
          to="/settings"
          className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px]"
          title="Account Settings"
        >
          <div className="w-9 h-9 rounded-full bg-primary-50 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm">
            {profile?.display_name ? (
              profile.display_name.charAt(0).toUpperCase()
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
        </Link>
      </div>
    </header>
  );
};
