import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const signOut = useAuthStore((state) => state.signOut);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const setProfile = useAuthStore((state) => state.setProfile);

  return {
    user,
    profile,
    loading,
    initialized,
    isAuthenticated: !!user,
    hasProfile: !!profile && !!profile.display_name,
    isAdmin: !!profile?.is_admin,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    fetchProfile,
    setProfile,
  };
};
