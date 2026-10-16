import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../ui/Spinner';

export interface ProfileRequiredProps {
  children: React.ReactElement;
}

export const ProfileRequired: React.FC<ProfileRequiredProps> = ({ children }) => {
  const { profile, loading, initialized, user } = useAuth();
  const location = useLocation();

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <Spinner size="lg" label="Checking profile..." />
      </div>
    );
  }

  // If user is authenticated but hasn't created a profile, send to setup
  if (user && (!profile || !profile.display_name)) {
    return <Navigate to="/profile/setup" state={{ from: location }} replace />;
  }

  return children;
};
