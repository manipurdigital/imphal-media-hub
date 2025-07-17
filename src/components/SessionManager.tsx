import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Smartphone, Monitor, Tablet, AlertCircle, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface DeviceSession {
  id: string;
  device_id: string;
  device_info: {
    userAgent: string;
    platform: string;
    screenResolution: string;
    timezone: string;
    language: string;
  };
  session_token: string;
  ip_address: string;
  is_active: boolean;
  last_activity: string;
  created_at: string;
  expires_at: string;
}

const SessionManager = () => {
  const { user, currentDeviceSession, getUserSessions, terminateSession } = useAuth();
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    try {
      const userSessions = await getUserSessions();
      setSessions(userSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    const agent = userAgent.toLowerCase();
    if (agent.includes('mobile') || agent.includes('android') || agent.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    } else if (agent.includes('tablet') || agent.includes('ipad')) {
      return <Tablet className="h-4 w-4" />;
    } else {
      return <Monitor className="h-4 w-4" />;
    }
  };

  const getDeviceType = (userAgent: string) => {
    const agent = userAgent.toLowerCase();
    if (agent.includes('mobile') || agent.includes('android') || agent.includes('iphone')) {
      return 'Mobile';
    } else if (agent.includes('tablet') || agent.includes('ipad')) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  };

  const getBrowserName = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  const isCurrentSession = (sessionToken: string) => {
    return currentDeviceSession?.session_token === sessionToken;
  };

  const handleTerminateSession = async (sessionToken: string) => {
    if (isCurrentSession(sessionToken)) {
      toast.error('You cannot terminate your current session');
      return;
    }

    setTerminating(sessionToken);
    try {
      const success = await terminateSession(sessionToken);
      if (success) {
        toast.success('Session terminated successfully');
        await loadSessions();
      } else {
        toast.error('Failed to terminate session');
      }
    } catch (error) {
      console.error('Failed to terminate session:', error);
      toast.error('Failed to terminate session');
    } finally {
      setTerminating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Loading your active sessions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Active Sessions
        </CardTitle>
        <CardDescription>
          Manage your active sessions across different devices. For security, only one device can be active at a time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No active sessions found.
            </p>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(session.device_info.userAgent)}
                    <div>
                      <div className="font-medium">
                        {getBrowserName(session.device_info.userAgent)} on {getDeviceType(session.device_info.userAgent)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {session.device_info.platform} • {session.device_info.screenResolution}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCurrentSession(session.session_token) && (
                      <Badge variant="secondary">Current Device</Badge>
                    )}
                    <Badge variant={session.is_active ? "default" : "secondary"}>
                      {session.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Last activity: {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>IP: {session.ip_address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Location: {session.device_info.timezone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Language: {session.device_info.language}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Created: {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                  </div>
                  {!isCurrentSession(session.session_token) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleTerminateSession(session.session_token)}
                      disabled={terminating === session.session_token}
                    >
                      {terminating === session.session_token ? 'Terminating...' : 'Terminate Session'}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Security Information</span>
          </div>
          <p className="text-sm text-muted-foreground">
            For security reasons, only one device can be active per account at any time. 
            When you sign in from a new device, you'll be asked to terminate sessions on other devices.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionManager;