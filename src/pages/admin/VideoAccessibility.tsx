import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface VideoAccessibilityData {
  id: string;
  title: string;
  video_url: string;
  hosting_type: string;
  accessibility_status: string;
  accessibility_checked_at: string;
}

const VideoAccessibility = () => {
  const [testingVideos, setTestingVideos] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch videos with accessibility data
  const { data: videos, isLoading } = useQuery({
    queryKey: ['videos-accessibility'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('id, title, video_url, hosting_type, accessibility_status, accessibility_checked_at')
        .order('accessibility_checked_at', { ascending: false });

      if (error) throw error;
      return data as VideoAccessibilityData[];
    },
  });

  // Test video accessibility
  const testAccessibility = useMutation({
    mutationFn: async (videoId: string) => {
      const video = videos?.find(v => v.id === videoId);
      if (!video) throw new Error('Video not found');

      // Update status to testing
      await supabase
        .from('videos')
        .update({ 
          accessibility_status: 'testing',
          accessibility_checked_at: new Date().toISOString()
        })
        .eq('id', videoId);

      // Test the video URL
      try {
        const response = await fetch(video.video_url, { 
          method: 'HEAD',
          mode: 'cors',
          cache: 'no-cache'
        });

        const status = response.ok ? 'accessible' : 'not_found';
        
        await supabase
          .from('videos')
          .update({ 
            accessibility_status: status,
            accessibility_checked_at: new Date().toISOString()
          })
          .eq('id', videoId);

        return status;
      } catch (error: any) {
        let status = 'cors_blocked';
        if (error.name === 'TypeError' && error.message.includes('CORS')) {
          status = 'cors_blocked';
        } else {
          status = 'not_found';
        }

        await supabase
          .from('videos')
          .update({ 
            accessibility_status: status,
            accessibility_checked_at: new Date().toISOString()
          })
          .eq('id', videoId);

        return status;
      }
    },
    onMutate: (videoId) => {
      setTestingVideos(prev => new Set(prev).add(videoId));
    },
    onSettled: (data, error, videoId) => {
      setTestingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['videos-accessibility'] });
    },
    onSuccess: (status, videoId) => {
      const video = videos?.find(v => v.id === videoId);
      toast.success(`Video "${video?.title}" tested: ${status}`);
    },
    onError: (error, videoId) => {
      const video = videos?.find(v => v.id === videoId);
      toast.error(`Failed to test "${video?.title}": ${error.message}`);
    },
  });

  // Bulk test all videos
  const bulkTest = useMutation({
    mutationFn: async () => {
      if (!videos) return;
      
      const externals = videos.filter(v => v.hosting_type === 'external');
      
      for (const video of externals) {
        await testAccessibility.mutateAsync(video.id);
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    },
    onSuccess: () => {
      toast.success('Bulk testing completed');
    },
    onError: (error) => {
      toast.error(`Bulk testing failed: ${error.message}`);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accessible':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cors_blocked':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'not_found':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'testing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accessible':
        return 'bg-green-500/20 text-green-200 border-green-500/30';
      case 'cors_blocked':
        return 'bg-red-500/20 text-red-200 border-red-500/30';
      case 'not_found':
        return 'bg-orange-500/20 text-orange-200 border-orange-500/30';
      case 'testing':
        return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
    }
  };

  const getHostingTypeColor = (type: string) => {
    switch (type) {
      case 'supabase':
        return 'bg-green-500/20 text-green-200 border-green-500/30';
      case 'youtube':
        return 'bg-red-500/20 text-red-200 border-red-500/30';
      case 'external':
        return 'bg-orange-500/20 text-orange-200 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const stats = {
    total: videos?.length || 0,
    accessible: videos?.filter(v => v.accessibility_status === 'accessible').length || 0,
    corsBlocked: videos?.filter(v => v.accessibility_status === 'cors_blocked').length || 0,
    notFound: videos?.filter(v => v.accessibility_status === 'not_found').length || 0,
    unknown: videos?.filter(v => v.accessibility_status === 'unknown').length || 0,
    supabase: videos?.filter(v => v.hosting_type === 'supabase').length || 0,
    youtube: videos?.filter(v => v.hosting_type === 'youtube').length || 0,
    external: videos?.filter(v => v.hosting_type === 'external').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Video Accessibility Management</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['videos-accessibility'] })}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => bulkTest.mutate()}
            disabled={bulkTest.isPending}
          >
            {bulkTest.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Test All External Videos
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Accessible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.accessible}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CORS Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.corsBlocked}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unknown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats.unknown}</div>
          </CardContent>
        </Card>
      </div>

      {/* Hosting Type Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Supabase Hosted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.supabase}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">YouTube</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.youtube}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">External</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.external}</div>
          </CardContent>
        </Card>
      </div>

      {/* Video List */}
      <Card>
        <CardHeader>
          <CardTitle>Video Accessibility Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {videos?.map((video) => (
            <div
              key={video.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <h3 className="font-medium">{video.title}</h3>
                <p className="text-sm text-muted-foreground truncate max-w-md">
                  {video.video_url}
                </p>
                {video.accessibility_checked_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last checked: {new Date(video.accessibility_checked_at).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge className={getHostingTypeColor(video.hosting_type)}>
                    {video.hosting_type}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(video.accessibility_status)}
                    <Badge className={getStatusColor(video.accessibility_status)}>
                      {video.accessibility_status}
                    </Badge>
                  </div>
                </div>

                {video.hosting_type === 'external' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testAccessibility.mutate(video.id)}
                    disabled={testingVideos.has(video.id) || testAccessibility.isPending}
                  >
                    {testingVideos.has(video.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoAccessibility;