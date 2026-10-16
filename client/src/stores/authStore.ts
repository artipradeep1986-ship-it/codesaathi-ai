import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { api } from '../services/api';
import type { StudentProfile } from '../types';

interface AuthState {
  user: User | null;
  profile: StudentProfile | null;
  loading: boolean;
  initialized: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  setProfile: (profile: StudentProfile) => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  setProfile: (profile: StudentProfile) => {
    set({ profile });
  },

  fetchProfile: async () => {
    try {
      const profile = await api.profile.get();
      set({ profile });
    } catch (err) {
      console.warn('Could not fetch student profile', err);
      set({ profile: null });
    }
  },

  initialize: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user });
        await get().fetchProfile();
      } else {
        set({ user: null, profile: null });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          set({ user: newSession?.user || null });
          if (newSession?.user) {
            await get().fetchProfile();
          }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ user: null, profile: null });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true });
    try {
      // 1. First attempt backend signup (bypasses Supabase email rate limits via admin.createUser)
      try {
        const res: any = await api.auth.signup(email, password);
        const session = res?.session || res?.data?.session;
        const user = res?.user || res?.data?.user;
        if (session) {
          const { error: sessionErr } = await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
          if (!sessionErr) {
            set({ user });
            await get().fetchProfile();
            return;
          }
        }
      } catch (backendErr: any) {
        // If backend returned a specific error message (e.g. user already exists), throw that cleanly
        if (backendErr?.message && !backendErr.message.includes('Network Error')) {
          throw backendErr;
        }
        console.warn('Backend signup fallback to direct Supabase auth:', backendErr);
      }

      // 2. Direct Supabase client fallback
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        if (error.message?.toLowerCase().includes('rate limit')) {
          throw new Error('Supabase email verification rate limit reached. Please wait a few moments or try logging in.');
        }
        throw error;
      }

      set({ user: data.user });
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Fallback to backend login endpoint
        try {
          const res: any = await api.auth.login(email, password);
          const session = res?.session || res?.data?.session;
          const user = res?.user || res?.data?.user;
          if (session) {
            await supabase.auth.setSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            });
            set({ user });
            await get().fetchProfile();
            return;
          }
        } catch {
          // Ignore fallback error and throw original Supabase error
        }
        throw error;
      }

      set({ user: data.user });
      await get().fetchProfile();
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null, profile: null });
    } finally {
      set({ loading: false });
    }
  },
}));
