import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Search, Trash2, Monitor, Smartphone, Tablet, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface UserSession {
  id: string;
  user_id: string;
  device_id: string;
  device_info: any;
  session_token: string;
  ip_address: string;
  is_active: boolean;
  last_activity: string;
  created_at: string;
  expires_at: string;
  profiles: {
    full_name: string;
    username: string;
  };
}

const SessionManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  // Fetch all sessions with user profiles
  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ['admin-sessions', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('user_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      const { data: sessionsData, error } = await query;
      if (error) throw error;

      // Fetch profiles separately and merge
      const userIds = sessionsData?.map(session => session.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username')
        .in('user_id', userIds);

      // Merge sessions with profiles
      const sessionsWithProfiles = sessionsData?.map(session => {
        const profile = profiles?.find(p => p.user_id === session.user_id);
        return {
          ...session,
          profiles: profile || { full_name: 'Unknown', username: 'unknown' }
        };
      }) || [];

      // Apply search filter after merging
      if (searchTerm) {
        return sessionsWithProfiles.filter(session => 
          session.profiles.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.profiles.username?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return sessionsWithProfiles;
    },
  });

  // Get session statistics
  const { data: stats } = useQuery({
    queryKey: ['session-stats'],
    queryFn: async () => {
      const { data: activeSessions } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { data: totalSessions } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true });

      const { data: expiredSessions } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .lt('expires_at', new Date().toISOString());

      return {
        active: activeSessions?.length || 0,
        total: totalSessions?.length || 0,
        expired: expiredSessions?.length || 0,
      };
    },
  });

  // Terminate session mutation
  const terminateSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-stats'] });
      toast.success('Session terminated successfully');
    },
    onError: (error) => {
      console.error('Error terminating session:', error);
      toast.error('Failed to terminate session');
    },
  });

  // Cleanup expired sessions mutation
  const cleanupExpiredMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('cleanup_expired_sessions');
      if (error) throw error;
      return data;
    },
    onSuccess: (cleanedUpCount) => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-stats'] });
      toast.success(`Cleaned up ${cleanedUpCount} expired sessions`);
    },
    onError: (error) => {
      console.error('Error cleaning up sessions:', error);
      toast.error('Failed to cleanup expired sessions');
    },
  });

  const getDeviceIcon = (deviceInfo: any) => {
    const userAgent = deviceInfo?.userAgent?.toLowerCase() || '';
    if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
      return <Tablet className="h-4 w-4" />;
    } else {
      return <Monitor className="h-4 w-4" />;
    }
  };

  const getDeviceType = (deviceInfo: any) => {
    const userAgent = deviceInfo?.userAgent?.toLowerCase() || '';
    if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
      return 'Mobile';
    } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  };

  const getBrowserName = (deviceInfo: any) => {
    const userAgent = deviceInfo?.userAgent;
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive">Failed to load sessions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Session Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage user sessions across all devices
          </p>
        </div>
        <Button
          onClick={() => cleanupExpiredMutation.mutate()}
          disabled={cleanupExpiredMutation.isPending}
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {cleanupExpiredMutation.isPending ? 'Cleaning...' : 'Cleanup Expired'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Expired Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.expired || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or username"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Sessions</CardTitle>
          <CardDescription>
            All user sessions with device information and activity status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{session.profiles.full_name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">@{session.profiles.username}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(session.device_info)}
                      <div>
                        <div className="font-medium">
                          {getBrowserName(session.device_info)} on {getDeviceType(session.device_info)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(session.device_info as any)?.platform || 'Unknown'} • {(session.device_info as any)?.screenResolution || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{session.ip_address}</TableCell>
                  <TableCell>
                    <Badge variant={session.is_active ? "default" : "secondary"}>
                      {session.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {session.is_active && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => terminateSessionMutation.mutate(session.id)}
                        disabled={terminateSessionMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {sessions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sessions found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionManagement;