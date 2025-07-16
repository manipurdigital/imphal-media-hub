import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileVideo, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const videoFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  genre: z.string().min(1, "Genre is required"),
  content_type: z.enum(['movie', 'series', 'documentary']),
  content_status: z.enum(['draft', 'published', 'archived']),
  year: z.number().min(1900).max(new Date().getFullYear() + 5).optional(),
  production_year: z.number().min(1900).max(new Date().getFullYear() + 5).optional(),
  duration: z.number().min(1).optional(),
  rating: z.number().min(0).max(10).optional(),
  director: z.string().optional(),
  cast_members: z.string().optional(), // We'll convert this to array
  trailer_url: z.string().url().optional().or(z.literal("")),
  video_url: z.string().min(1, "Video URL is required"),
  thumbnail_url: z.string().optional(),
});

type VideoFormData = z.infer<typeof videoFormSchema>;

interface VideoFormProps {
  video?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const VideoForm = ({ video, onSuccess, onCancel }: VideoFormProps) => {
  const { toast } = useToast();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<VideoFormData>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      title: video?.title || '',
      description: video?.description || '',
      genre: video?.genre || '',
      content_type: video?.content_type || 'movie',
      content_status: video?.content_status || 'draft',
      year: video?.year || undefined,
      production_year: video?.production_year || undefined,
      duration: video?.duration || undefined,
      rating: video?.rating || undefined,
      director: video?.director || '',
      cast_members: video?.cast_members?.join(', ') || '',
      trailer_url: video?.trailer_url || '',
      video_url: video?.video_url || '',
      thumbnail_url: video?.thumbnail_url || '',
    },
  });

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const onSubmit = async (data: VideoFormData) => {
    try {
      setIsUploading(true);
      
      // Upload files if selected
      let videoUrl = data.video_url;
      let thumbnailUrl = data.thumbnail_url;

      if (videoFile) {
        const videoPath = `videos/${Date.now()}-${videoFile.name}`;
        videoUrl = await uploadFile(videoFile, 'videos', videoPath);
      }

      if (thumbnailFile) {
        const thumbnailPath = `thumbnails/${Date.now()}-${thumbnailFile.name}`;
        thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnails', thumbnailPath);
      }

      // Convert cast members string to array
      const castArray = data.cast_members 
        ? data.cast_members.split(',').map(name => name.trim()).filter(Boolean)
        : [];

      const videoData = {
        ...data,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || null,
        cast_members: castArray,
        // Convert empty strings to null for optional fields
        trailer_url: data.trailer_url || null,
        director: data.director || null,
        description: data.description || null,
      };

      if (video?.id) {
        // Update existing video
        const { error } = await supabase
          .from('videos')
          .update(videoData)
          .eq('id', video.id);

        if (error) throw error;

        toast({
          title: "Video updated",
          description: "The video has been successfully updated.",
        });
      } else {
        // Create new video
        const { error } = await supabase
          .from('videos')
          .insert([videoData]);

        if (error) throw error;

        toast({
          title: "Video created",
          description: "The video has been successfully created.",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'thumbnail') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'video') {
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file.",
          variant: "destructive",
        });
        return;
      }
      setVideoFile(file);
      form.setValue('video_url', `file://${file.name}`);
    } else {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      setThumbnailFile(file);
      form.setValue('thumbnail_url', `file://${file.name}`);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{video ? 'Edit Video' : 'Add New Video'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter video title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Action, Drama, Comedy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter video description"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content Type and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="content_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="movie">Movie</SelectItem>
                        <SelectItem value="series">Series</SelectItem>
                        <SelectItem value="documentary">Documentary</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Video Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Release Year</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="2024"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="production_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Production Year</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="2024"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="120"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating (0-10)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="8.5"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Cast and Director */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="director"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Director</FormLabel>
                    <FormControl>
                      <Input placeholder="Director name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cast_members"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cast Members</FormLabel>
                    <FormControl>
                      <Input placeholder="Actor 1, Actor 2, Actor 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* File Uploads */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Media Files</h3>
              
              {/* Video Upload */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="video_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video File *</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Video URL or upload file" {...field} />
                        </FormControl>
                        <div className="relative">
                          <input
                            type="file"
                            accept="video/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => handleFileSelect(e, 'video')}
                          />
                          <Button type="button" variant="outline" className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Upload
                          </Button>
                        </div>
                      </div>
                      {videoFile && (
                        <Badge variant="secondary" className="flex items-center gap-2 w-fit">
                          <FileVideo className="h-3 w-3" />
                          {videoFile.name}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => {
                              setVideoFile(null);
                              form.setValue('video_url', '');
                            }}
                          />
                        </Badge>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="thumbnail_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Thumbnail URL or upload file" {...field} />
                        </FormControl>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => handleFileSelect(e, 'thumbnail')}
                          />
                          <Button type="button" variant="outline" className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Upload
                          </Button>
                        </div>
                      </div>
                      {thumbnailFile && (
                        <Badge variant="secondary" className="flex items-center gap-2 w-fit">
                          <Image className="h-3 w-3" />
                          {thumbnailFile.name}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => {
                              setThumbnailFile(null);
                              form.setValue('thumbnail_url', '');
                            }}
                          />
                        </Badge>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Trailer URL */}
              <FormField
                control={form.control}
                name="trailer_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trailer URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-6">
              <Button 
                type="submit" 
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    {video ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  video ? 'Update Video' : 'Create Video'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};