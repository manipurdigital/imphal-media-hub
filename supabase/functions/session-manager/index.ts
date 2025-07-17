import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionRequest {
  action: 'create' | 'validate' | 'terminate' | 'list' | 'cleanup';
  userId?: string;
  sessionToken?: string;
  deviceId?: string;
  deviceInfo?: any;
  ipAddress?: string;
  terminateOthers?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    );

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: SessionRequest = await req.json();
    console.log('Session manager request:', body);

    switch (body.action) {
      case 'create':
        return await handleCreateSession(supabase, body, user.id);
      case 'validate':
        return await handleValidateSession(supabase, body);
      case 'terminate':
        return await handleTerminateSession(supabase, body, user.id);
      case 'list':
        return await handleListSessions(supabase, user.id);
      case 'cleanup':
        return await handleCleanupSessions(supabase);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Session manager error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleCreateSession(supabase: any, body: SessionRequest, userId: string) {
  const { deviceId, deviceInfo, ipAddress, terminateOthers } = body;

  if (!deviceId || !deviceInfo) {
    return new Response(
      JSON.stringify({ error: 'Device ID and device info are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Check for existing active sessions
    const { data: existingSessions, error: checkError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    if (checkError) {
      console.error('Error checking existing sessions:', checkError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for session conflicts
    const otherDeviceSession = existingSessions?.find(
      session => session.device_id !== deviceId
    );

    if (otherDeviceSession && !terminateOthers) {
      return new Response(
        JSON.stringify({
          error: 'Session conflict',
          conflictingSession: otherDeviceSession,
          message: 'Your account is already active on another device.'
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate session token
    const sessionToken = crypto.randomUUID();

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
    const { data: newSession, error: insertError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        device_id: deviceId,
        device_info: deviceInfo,
        session_token: sessionToken,
        ip_address: ipAddress,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating session:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ session: newSession }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handleCreateSession:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleValidateSession(supabase: any, body: SessionRequest) {
  const { sessionToken } = body;

  if (!sessionToken) {
    return new Response(
      JSON.stringify({ error: 'Session token is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid or expired session' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last activity
    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', session.id);

    return new Response(
      JSON.stringify({ valid: true, session }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handleValidateSession:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleTerminateSession(supabase: any, body: SessionRequest, userId: string) {
  const { sessionToken } = body;

  if (!sessionToken) {
    return new Response(
      JSON.stringify({ error: 'Session token is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('session_token', sessionToken)
      .eq('user_id', userId);

    if (error) {
      console.error('Error terminating session:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to terminate session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handleTerminateSession:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleListSessions(supabase: any, userId: string) {
  try {
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch sessions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ sessions: sessions || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handleListSessions:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleCleanupSessions(supabase: any) {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_sessions');

    if (error) {
      console.error('Error cleaning up sessions:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to cleanup sessions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ cleanedUp: data || 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in handleCleanupSessions:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}