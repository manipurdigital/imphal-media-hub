import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateDeviceFingerprint, generateSessionToken, getClientIP } from '@/utils/deviceFingerprint';
import type { DeviceFingerprint } from '@/utils/deviceFingerprint';

export interface UserSession {
  id: string;
  user_id: string;
  device_id: string;
  device_info: any;
  session_token: string;
  ip_address: string | null;
  is_active: boolean;
  last_activity: string;
  created_at: string;
  expires_at: string;
}

export interface SessionConflict {
  hasConflict: boolean;
  existingSession?: UserSession;
  message?: string;
}

export const useSessionManager = () => {
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState<DeviceFingerprint | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize device fingerprint
  useEffect(() => {
    const initializeFingerprint = async () => {
      try {
        const fingerprint = await generateDeviceFingerprint();
        setDeviceFingerprint(fingerprint);
      } catch (error) {
        console.error('Failed to generate device fingerprint:', error);
      }
    };

    initializeFingerprint();
  }, []);

  // Check for session conflicts
  const checkSessionConflict = useCallback(async (userId: string): Promise<SessionConflict> => {
    if (!deviceFingerprint) {
      return { hasConflict: false };
    }

    try {
      const { data: activeSessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error checking session conflicts:', error);
        return { hasConflict: false };
      }

      // Check if there's an active session from a different device
      const otherDeviceSession = activeSessions?.find(
        session => session.device_id !== deviceFingerprint.deviceId
      );

      if (otherDeviceSession) {
        return {
          hasConflict: true,
          existingSession: otherDeviceSession,
          message: 'Your account is already active on another device.'
        };
      }

      return { hasConflict: false };
    } catch (error) {
      console.error('Error checking session conflicts:', error);
      return { hasConflict: false };
    }
  }, [deviceFingerprint]);

  // Create a new session
  const createSession = useCallback(async (userId: string, terminateOthers: boolean = true): Promise<UserSession | null> => {
    if (!deviceFingerprint) {
      throw new Error('Device fingerprint not available');
    }

    setIsLoading(true);
    try {
      const sessionToken = generateSessionToken();
      const ipAddress = await getClientIP();
      
      // Calculate expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Terminate other sessions if requested
      if (terminateOthers) {
        await supabase.rpc('terminate_other_sessions', {
          _user_id: userId,
          _current_session_token: sessionToken
        });
      }

      // Create new session
      const { data: newSession, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          device_id: deviceFingerprint.deviceId,
          device_info: deviceFingerprint.deviceInfo as any,
          session_token: sessionToken,
          ip_address: ipAddress,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        throw error;
      }

      setCurrentSession(newSession);
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [deviceFingerprint]);

  // Validate current session
  const validateSession = useCallback(async (sessionToken: string): Promise<boolean> => {
    try {
      const { data: session, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !session) {
        return false;
      }

      // Update last activity
      await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', session.id);

      setCurrentSession(session);
      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }, []);

  // Terminate current session
  const terminateSession = useCallback(async (sessionToken?: string): Promise<boolean> => {
    try {
      const tokenToTerminate = sessionToken || currentSession?.session_token;
      
      if (!tokenToTerminate) {
        return false;
      }

      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_token', tokenToTerminate);

      if (error) {
        console.error('Error terminating session:', error);
        return false;
      }

      if (!sessionToken) {
        setCurrentSession(null);
      }

      return true;
    } catch (error) {
      console.error('Error terminating session:', error);
      return false;
    }
  }, [currentSession]);

  // Get all user sessions
  const getUserSessions = useCallback(async (userId: string): Promise<UserSession[]> => {
    try {
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user sessions:', error);
        return [];
      }

      return sessions || [];
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
  }, []);

  // Cleanup expired sessions
  const cleanupExpiredSessions = useCallback(async (): Promise<void> => {
    try {
      await supabase.rpc('cleanup_expired_sessions');
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }, []);

  return {
    currentSession,
    deviceFingerprint,
    isLoading,
    checkSessionConflict,
    createSession,
    validateSession,
    terminateSession,
    getUserSessions,
    cleanupExpiredSessions,
  };
};