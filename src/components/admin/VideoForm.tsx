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
import { Switch } from '@/components/ui/switch';
import { Upload, X, FileVideo, Image, Monitor, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isYouTubeUrl } from '@/utils/youtube';
import { isVimeoUrl } from '@/utils/vimeo';
import { analyzeVideoUrl } from '@/utils/videoUrl';

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
  video_url: z.string().min(1, "Video URL is required").refine((url) => {
    if (!url) return false;
    // Allow file:// URLs for file uploads
    if (url.startsWith('file://')) return true;
    // Validate URL format and supported hosting
    const urlInfo = analyzeVideoUrl(url);
    return urlInfo.isValid;
  }, "Please provide a valid video URL (YouTube, Vimeo, or direct video file)"),
  thumbnail_url: z.string().optional(),
  // Resolution fields
  resolution: z.string().min(1, "Resolution is required"),
  quality_label: z.string().min(1, "Quality label is required"),
  bitrate: z.number().optional(),
  is_default: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_pay_per_view: z.boolean().optional(),
  ppv_price: z.number().min(0).optional(),
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
  
  // Common resolution presets
  const resolutionPresets = [
    { value: '480p', label: 'SD (480p)' },
    { value: '720p', label: 'HD (720p)' },
    { value: '1080p', label: 'Full HD (1080p)' },
    { value: '1440p', label: 'QHD (1440p)' },
    { value: '2160p', label: '4K (2160p)' },
  ];

  const qualityPresets = [
    { value: 'Low', label: 'Low Quality' },
    { value: 'Standard', label: 'Standard Quality' },
    { value: 'High', label: 'High Quality' },
    { value: 'Ultra', label: 'Ultra Quality' },
  ];

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
      // Resolution defaults
      resolution: '720p',
      quality_label: 'Standard',
      bitrate: undefined,
      is_default: true,
      is_featured: video?.is_featured || false,
      is_pay_per_view: false,
      ppv_price: undefined,
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
        title: data.title,
        description: data.description || null,
        genre: data.genre,
        content_type: data.content_type,
        content_status: data.content_status,
        year: data.year,
        production_year: data.production_year,
        duration: data.duration,
        rating: data.rating,
        director: data.director || null,
        cast_members: castArray,
        trailer_url: data.trailer_url || null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || null,
      };

      let videoId = video?.id;

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
        const { data: videoResult, error } = await supabase
          .from('videos')
          .insert([videoData])
          .select()
          .single();

        if (error) throw error;
        videoId = videoResult.id;

        // Create video_sources entry for the uploaded video
        const videoSourceData = {
          video_id: videoResult.id,
          resolution: data.resolution,
          quality_label: data.quality_label,
          source_url: videoUrl,
          bitrate: data.bitrate || null,
          file_size: videoFile?.size || null,
          is_default: data.is_default ?? true,
        };

        const { error: sourceError } = await supabase
          .from('video_sources')
          .insert([videoSourceData]);

        if (sourceError) throw sourceError;

        toast({
          title: "Video created",
          description: "The video has been successfully created with resolution settings.",
        });
      }

      // Handle featured video logic
      if (videoId) {
        if (data.is_featured) {
          const { error: featuredError } = await supabase
            .rpc('set_featured_video', { _video_id: videoId });

          if (featuredError) throw featuredError;
        } else if (video?.is_featured && !data.is_featured) {
          // If it was featured but now it's not, unfeature it
          const { error: unfeaturedError } = await supabase
            .rpc('unset_featured_video', { _video_id: videoId });

          if (unfeaturedError) throw unfeaturedError;
        }
      }

      // Handle pay-per-view logic
      if (videoId && data.is_pay_per_view && data.ppv_price) {
        const ppvData = {
          video_id: videoId,
          title: data.title,
          description: data.description || 'Premium content',
          price: data.ppv_price,
          currency: 'INR',
          duration_minutes: data.duration || 120,
          thumbnail_url: thumbnailUrl || '/placeholder.svg',
          is_active: true
        };

        const { error: ppvError } = await supabase
          .from('pay_per_view_content')
          .upsert(ppvData, { 
            onConflict: 'video_id',
            ignoreDuplicates: false 
          });

        if (ppvError) throw ppvError;
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

  const handleUrlChange = (value: string) => {
    // Auto-detect hosting type and provide helpful feedback
    if (value) {
      const urlInfo = analyzeVideoUrl(value);
      
      if (urlInfo.type === 'youtube' || urlInfo.type === 'vimeo') {
        // For YouTube and Vimeo, we don't need resolution settings
        form.setValue('resolution', '720p');
        form.setValue('quality_label', 'Standard');
      }
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Featured Video Toggle */}
              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-center">
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Featured Video
                      </FormLabel>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Display as hero video on homepage
                    </p>
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
                        <FormLabel>Video File * (URL or Upload)</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/... or upload file" 
                              {...field} 
                              onChange={(e) => {
                                field.onChange(e);
                                handleUrlChange(e.target.value);
                              }}
                            />
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
                        
                        {/* Show video type indicator */}
                        {field.value && !field.value.startsWith('file://') && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Monitor className="h-4 w-4" />
                            {(() => {
                              const urlInfo = analyzeVideoUrl(field.value);
                              switch (urlInfo.type) {
                                case 'youtube':
                                  return <span className="text-red-600">YouTube Video</span>;
                                case 'vimeo':
                                  return <span className="text-blue-600">Vimeo Video</span>;
                                case 'supabase':
                                  return <span className="text-green-600">Supabase Storage</span>;
                                default:
                                  return <span className="text-gray-600">External Video</span>;
                              }
                            })()}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              {/* Resolution Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <h4 className="text-sm font-medium">Resolution Settings</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="resolution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resolution *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select resolution" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {resolutionPresets.map((preset) => (
                              <SelectItem key={preset.value} value={preset.value}>
                                {preset.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quality_label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quality Label *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select quality" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {qualityPresets.map((preset) => (
                              <SelectItem key={preset.value} value={preset.value}>
                                {preset.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bitrate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bitrate (kbps)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="2000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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

            {/* Pay Per View Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pay Per View Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="is_pay_per_view"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-center">
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="flex items-center gap-2">
                          💰 Pay Per View
                        </FormLabel>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enable pay-per-view access for this video
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('is_pay_per_view') && (
                  <FormField
                    control={form.control}
                    name="ppv_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (INR)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            placeholder="99.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
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