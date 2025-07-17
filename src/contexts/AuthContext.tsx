import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useSessionManager } from '@/hooks/useSessionManager';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (emailOrProvider: string, password?: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (emailOrProvider: string, password?: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  currentDeviceSession: any;
  getUserSessions: () => Promise<any[]>;
  terminateSession: (sessionToken: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const sessionManager = useSessionManager();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetching to avoid potential issues
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (emailOrProvider: string, password?: string, fullName?: string) => {
    try {
      // Handle OAuth providers
      if (emailOrProvider === 'google') {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
          }
        });
        return { error };
      }

      // Handle email/password signup
      if (!password) {
        return { error: new Error('Password is required for email signup') };
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: emailOrProvider,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || '',
          }
        }
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (emailOrProvider: string, password?: string) => {
    try {
      // Handle OAuth providers
      if (emailOrProvider === 'google') {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
          }
        });
        return { error };
      }

      // Handle email/password signin
      if (!password) {
        return { error: new Error('Password is required for email signin') };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailOrProvider,
        password,
      });

      if (error) {
        return { error };
      }

      // After successful authentication, handle device session
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Check for session conflicts
        const conflict = await sessionManager.checkSessionConflict(authUser.id);
        
        if (conflict.hasConflict) {
          // Show user a choice to terminate other sessions or cancel
          const terminateOthers = window.confirm(
            `${conflict.message} Do you want to sign out from other devices and continue?`
          );
          
          if (!terminateOthers) {
            await supabase.auth.signOut();
            return { error: new Error('Sign-in cancelled due to existing session') };
          }
        }

        // Create new session (this will terminate others if needed)
        try {
          await sessionManager.createSession(authUser.id, true);
          toast.success('Signed in successfully');
        } catch (sessionError) {
          console.error('Session creation error:', sessionError);
          // Don't fail the login for session errors, just log them
          toast.warning('Signed in, but session management may not work properly');
        }
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Terminate current session before signing out
      if (sessionManager.currentSession) {
        await sessionManager.terminateSession();
      }
      
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user found') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (!error && profile) {
        setProfile({ ...profile, ...updates });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    currentDeviceSession: sessionManager.currentSession,
    getUserSessions: () => sessionManager.getUserSessions(user?.id || ''),
    terminateSession: sessionManager.terminateSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};