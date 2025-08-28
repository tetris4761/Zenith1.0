import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSupabaseClient } from '../lib/supabase';

// Lightweight user/profile types for app usage
interface User {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>; 
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    async function init() {
      // If Supabase is configured, hydrate from session and subscribe to auth changes
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user;
        if (sessionUser) {
          setUser({ id: sessionUser.id, email: sessionUser.email ?? '' });
        }
        setLoading(false);

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          const u = session?.user;
          if (u) {
            setUser({ id: u.id, email: u.email ?? '' });
          } else {
            setUser(null);
            setProfile(null);
          }
        });
        unsub = () => listener.subscription.unsubscribe();
        return;
      }

      // Fallback when Supabase env is missing: just stop loading, keep mock unauthenticated state
      setLoading(false);
    }

    void init();
    return () => { if (unsub) unsub(); };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        return {};
      }
      // Mock fallback
      setUser({ id: 'mock-user-id', email });
      setProfile({ id: 'mock-profile-id', user_id: 'mock-user-id', full_name: 'Demo User' });
      return {};
    } catch (e) {
      return { error: 'Failed to sign in' };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      if (supabase) {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) return { error: error.message };
        return {};
      }
      // Mock fallback
      setUser({ id: 'mock-user-id', email });
      setProfile({ id: 'mock-profile-id', user_id: 'mock-user-id', full_name: fullName });
      return {};
    } catch (_e) {
      return { error: 'Failed to sign up' };
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
