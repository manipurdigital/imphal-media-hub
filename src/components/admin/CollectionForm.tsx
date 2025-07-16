import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const collectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required'),
  description: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  display_order: z.number().min(0),
  video_ids: z.array(z.string()).optional(),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

interface CollectionFormProps {
  collection?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CollectionForm: React.FC<CollectionFormProps> = ({
  collection,
  onSuccess,
  onCancel,
}) => {
  const { toast } = useToast();
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);

  const { data: videos } = useQuery({
    queryKey: ['allVideos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('id, title, thumbnail_url')
        .eq('content_status', 'published')
        .order('title');

      if (error) throw error;
      return data;
    },
  });

  const { data: collectionVideos } = useQuery({
    queryKey: ['collectionVideos', collection?.id],
    queryFn: async () => {
      if (!collection?.id) return [];
      
      const { data, error } = await supabase
        .from('video_collections')
        .select('video_id')
        .eq('collection_id', collection.id);

      if (error) throw error;
      return data.map(item => item.video_id);
    },
    enabled: !!collection?.id,
  });

  const form = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: collection?.name || '',
      description: collection?.description || '',
      slug: collection?.slug || '',
      is_active: collection?.is_active ?? true,
      is_featured: collection?.is_featured ?? false,
      display_order: collection?.display_order ?? 0,
    },
  });

  // Update selected videos when collection videos load
  useEffect(() => {
    if (collectionVideos) {
      setSelectedVideos(collectionVideos);
    }
  }, [collectionVideos]);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const createMutation = useMutation({
    mutationFn: async (data: CollectionFormData) => {
      const { error } = await supabase
        .from('collections')
        .insert([{
          name: data.name,
          description: data.description,
          slug: data.slug,
          is_active: data.is_active,
          is_featured: data.is_featured,
          display_order: data.display_order,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Collection created",
        description: "The collection has been successfully created.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create collection: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CollectionFormData) => {
      const { error } = await supabase
        .from('collections')
        .update({
          name: data.name,
          description: data.description,
          slug: data.slug,
          is_active: data.is_active,
          is_featured: data.is_featured,
          display_order: data.display_order,
        })
        .eq('id', collection.id);

      if (error) throw error;

      // Update video relationships
      if (selectedVideos.length > 0) {
        // Remove existing relationships
        await supabase
          .from('video_collections')
          .delete()
          .eq('collection_id', collection.id);

        // Add new relationships
        const videoCollections = selectedVideos.map((videoId, index) => ({
          collection_id: collection.id,
          video_id: videoId,
          display_order: index,
        }));

        await supabase
          .from('video_collections')
          .insert(videoCollections);
      }
    },
    onSuccess: () => {
      toast({
        title: "Collection updated",
        description: "The collection has been successfully updated.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update collection: " + error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CollectionFormData) => {
    if (collection) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleVideoToggle = (videoId: string, checked: boolean) => {
    setSelectedVideos(prev => 
      checked 
        ? [...prev, videoId]
        : prev.filter(id => id !== videoId)
    );
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Collection Name</Label>
          <Input
            id="name"
            {...form.register('name')}
            onChange={(e) => {
              form.setValue('name', e.target.value);
              form.setValue('slug', generateSlug(e.target.value));
            }}
            placeholder="Enter collection name"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            {...form.register('slug')}
            placeholder="collection-slug"
          />
          {form.formState.errors.slug && (
            <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          placeholder="Enter collection description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="display_order">Display Order</Label>
          <Input
            id="display_order"
            type="number"
            {...form.register('display_order', { valueAsNumber: true })}
            placeholder="0"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            {...form.register('is_active')}
            checked={form.watch('is_active')}
            onCheckedChange={(checked) => form.setValue('is_active', checked)}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_featured"
            {...form.register('is_featured')}
            checked={form.watch('is_featured')}
            onCheckedChange={(checked) => form.setValue('is_featured', checked)}
          />
          <Label htmlFor="is_featured">Featured</Label>
        </div>
      </div>

      {/* Video Selection */}
      {collection && videos && (
        <div className="space-y-2">
          <Label>Videos in Collection</Label>
          <div className="border rounded-lg p-4">
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {videos.map((video) => (
                  <div key={video.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={video.id}
                      checked={selectedVideos.includes(video.id)}
                      onCheckedChange={(checked) => handleVideoToggle(video.id, checked as boolean)}
                    />
                    <div className="flex items-center space-x-3 flex-1">
                      {video.thumbnail_url && (
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title}
                          className="w-16 h-12 object-cover rounded"
                        />
                      )}
                      <Label htmlFor={video.id} className="flex-1 cursor-pointer">
                        {video.title}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {collection ? 'Update Collection' : 'Create Collection'}
        </Button>
      </div>
    </form>
  );
};