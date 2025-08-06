import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Eye, Video, Search, Filter, Activity, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VideoForm } from '@/components/admin/VideoForm';
import { VideoHealthDashboard } from '@/components/admin/VideoHealthDashboard';

export const VideoManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data: videos, isLoading } = useQuery({
    queryKey: ['adminVideos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .is('deleted_at', null) // Only get non-deleted videos
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      // Use soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from('videos')
        .update({ deleted_at: new Date().toISOString() })
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

  const handleEditVideo = (video: any) => {
    setEditingVideo(video);
    setShowForm(true);
  };

  const handleAddVideo = () => {
    setEditingVideo(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingVideo(null);
    queryClient.invalidateQueries({ queryKey: ['adminVideos'] });
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingVideo(null);
  };

  // Filter videos based on search and filters
  const filteredVideos = videos?.filter((video) => {
    const matchesSearch = !searchTerm || 
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.genre.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || video.content_status === statusFilter;
    const matchesType = typeFilter === 'all' || video.content_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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
        <Button onClick={handleAddVideo} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Video
        </Button>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Health Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-6 mt-6">

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos by title, description, or genre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="movie">Movie</SelectItem>
            <SelectItem value="series">Series</SelectItem>
            <SelectItem value="documentary">Documentary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredVideos?.map((video) => (
          <Card key={video.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{video.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{video.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {video.is_featured && (
                    <Badge variant="default" className="bg-yellow-500 text-black hover:bg-yellow-600">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditVideo(video)}
                  >
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

      {!filteredVideos?.length && videos?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <Filter className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No videos match your filters</h3>
            <p className="text-muted-foreground text-center mb-4">
              Try adjusting your search terms or filters to find videos.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : !videos?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <Video className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No videos found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first video to the platform.
            </p>
            <Button onClick={handleAddVideo}>
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </CardContent>
        </Card>
      ) : null}
        </TabsContent>

        <TabsContent value="health" className="space-y-6 mt-6">
          <VideoHealthDashboard />
        </TabsContent>
      </Tabs>

      {/* Video Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVideo ? 'Edit Video' : 'Add New Video'}</DialogTitle>
          </DialogHeader>
          <VideoForm
            video={editingVideo}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};