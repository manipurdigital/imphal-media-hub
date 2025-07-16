import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, CheckCircle, AlertCircle, XCircle, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  runVideoHealthCheck,
  fixMissingVideoSources,
  getVideosNeedingAttention,
  updateVideoAccessibilityStatus,
  type VideoHealthCheck,
  type VideoValidationResult
} from '@/utils/videoValidation';

export const VideoHealthDashboard = () => {
  const [healthCheck, setHealthCheck] = useState<VideoHealthCheck | null>(null);
  const [needsAttention, setNeedsAttention] = useState<VideoValidationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const { toast } = useToast();

  const loadHealthCheck = async () => {
    setIsLoading(true);
    try {
      const [healthData, attentionData] = await Promise.all([
        runVideoHealthCheck(),
        getVideosNeedingAttention()
      ]);
      
      setHealthCheck(healthData);
      setNeedsAttention(attentionData);
    } catch (error) {
      console.error('Failed to load video health check:', error);
      toast({
        title: "Error",
        description: "Failed to load video health status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixMissingSources = async () => {
    setIsFixing(true);
    try {
      const result = await fixMissingVideoSources();
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        // Reload health check after fixing
        await loadHealthCheck();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to fix missing video sources:', error);
      toast({
        title: "Error",
        description: "Failed to fix missing video sources",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  const handleUpdateVideoStatus = async (videoId: string, status: 'accessible' | 'not_found' | 'cors_blocked') => {
    try {
      await updateVideoAccessibilityStatus(videoId, status);
      toast({
        title: "Success",
        description: "Video status updated successfully",
      });
      await loadHealthCheck();
    } catch (error) {
      console.error('Failed to update video status:', error);
      toast({
        title: "Error",
        description: "Failed to update video status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadHealthCheck();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accessible':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Accessible</Badge>;
      case 'cors_blocked':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />CORS Blocked</Badge>;
      case 'not_found':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Not Found</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Unknown</Badge>;
    }
  };

  const healthPercentage = healthCheck ? 
    Math.round((healthCheck.accessibleVideos / healthCheck.totalVideos) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Video Health Dashboard</h2>
        <Button 
          onClick={loadHealthCheck} 
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthCheck?.totalVideos || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Accessible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthCheck?.accessibleVideos || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{healthCheck?.blockedVideos || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unknown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{healthCheck?.unknownVideos || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Health Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Health</CardTitle>
          <CardDescription>
            {healthPercentage}% of videos are accessible and playable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={healthPercentage} className="w-full" />
          <div className="mt-2 text-sm text-gray-500">
            {healthCheck?.accessibleVideos || 0} of {healthCheck?.totalVideos || 0} videos are working properly
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Tools to fix common video playback issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button 
              onClick={handleFixMissingSources}
              disabled={isFixing}
              className="w-full sm:w-auto"
            >
              <Wrench className={`w-4 h-4 mr-2 ${isFixing ? 'animate-spin' : ''}`} />
              Fix Missing Video Sources
            </Button>
            <p className="text-sm text-gray-600">
              Creates missing video_sources entries for videos that don't have them
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Videos Needing Attention */}
      {needsAttention.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Videos Needing Attention</CardTitle>
            <CardDescription>
              {needsAttention.length} videos have issues that need to be addressed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {needsAttention.map((video) => (
                <Alert key={video.videoId}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="flex items-center justify-between">
                    <span>{video.title}</span>
                    {getStatusBadge(video.status)}
                  </AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">{video.message}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateVideoStatus(video.videoId, 'accessible')}
                      >
                        Mark as Accessible
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateVideoStatus(video.videoId, 'cors_blocked')}
                      >
                        Mark as CORS Blocked
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};