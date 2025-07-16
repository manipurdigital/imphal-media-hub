import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ContentCarousel from './ContentCarousel';
import { useToast } from '@/hooks/use-toast';

interface OriginalsItem {
  id: string;
  title: string;
  image: string;
  rating: number;
  year: number;
  genre: string;
  duration: string;
  description: string;
  videoUrl: string;
  castMembers: string[];
  director: string;
  contentType: string;
  categories: string[];
  trailerUrl: string;
}

const KangleiFlixOriginalsSection = () => {
  const [originalsItems, setOriginalsItems] = useState<OriginalsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  useEffect(() => {
    const fetchOriginalsContent = async () => {
      try {
        // First get the KangleiFlix Originals collection
        const { data: collection, error: collectionError } = await supabase
          .from('collections')
          .select('id')
          .eq('slug', 'kangleiflix-originals')
          .single();

        if (collectionError) throw collectionError;

        // Then get videos in that collection
        const { data, error } = await supabase
          .from('videos')
          .select(`
            *,
            video_categories(
              categories(name)
            ),
            video_collections!inner(
              collection_id
            )
          `)
          .eq('content_status', 'published')
          .eq('video_collections.collection_id', collection.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedItems: OriginalsItem[] = data.map(video => ({
          id: video.id,
          title: video.title,
          image: video.thumbnail_url || '/api/placeholder/400/600',
          rating: video.rating || 0,
          year: video.year || video.production_year || 2024,
          genre: video.genre,
          duration: formatDuration(video.duration),
          description: video.description || '',
          videoUrl: video.video_url,
          castMembers: video.cast_members || [],
          director: video.director || '',
          contentType: video.content_type || 'movie',
          categories: video.video_categories?.map((vc: any) => vc.categories?.name).filter(Boolean) || [],
          trailerUrl: video.trailer_url || ''
        }));

        setOriginalsItems(formattedItems);
      } catch (error) {
        console.error('Error fetching KangleiFlix Originals:', error);
        toast({
          title: "Error",
          description: "Failed to load KangleiFlix Originals",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOriginalsContent();
  }, [toast]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent rounded mb-4 w-64"></div>
        <div className="flex space-x-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-64 h-96 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (originalsItems.length === 0) return null;

  return (
    <div className="relative">
      {/* KangleiFlix Originals have a special badge/styling */}
      <div className="absolute -top-2 left-4 z-10">
        <div className="bg-gradient-to-r from-primary to-primary-glow px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg">
          ORIGINAL
        </div>
      </div>
      <ContentCarousel
        title="KangleiFlix Originals"
        items={originalsItems}
      />
    </div>
  );
};

export default KangleiFlixOriginalsSection;