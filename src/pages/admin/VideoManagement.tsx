import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const VideoManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: videos, isLoading } = useQuery({
    queryKey: ['adminVideos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVideos'] });
      toast({
        title: "Video deleted",
        description: "The video has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete video: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteVideo = async (videoId: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Video Management</h1>
          <p className="text-muted-foreground">Manage your video content library</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Video
        </Button>
      </div>

      <div className="grid gap-4">
        {videos?.map((video) => (
          <Card key={video.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{video.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{video.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={video.content_status === 'published' ? 'default' : 'secondary'}>
                    {video.content_status}
                  </Badge>
                  <Badge variant="outline">{video.content_type}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Genre:</span>
                    <p className="font-medium">{video.genre}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Year:</span>
                    <p className="font-medium">{video.year || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <p className="font-medium">{video.duration ? `${video.duration} min` : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Views:</span>
                    <p className="font-medium">{video.view_count || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteVideo(video.id)}
                    disabled={deleteVideoMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!videos?.length && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <Video className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No videos found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first video to the platform.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};