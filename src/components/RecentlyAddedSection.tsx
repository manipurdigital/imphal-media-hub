import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ContentCarousel from './ContentCarousel';
import { useToast } from '@/hooks/use-toast';

interface RecentlyAddedItem {
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

const RecentlyAddedSection = () => {
  const [recentItems, setRecentItems] = useState<RecentlyAddedItem[]>([]);
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
    const fetchRecentlyAdded = async () => {
      try {
        const { data, error } = await supabase
          .from('videos_browse')
          .select(`
            *,
            video_categories(
              categories(name)
            )
          `)
          .eq('content_status', 'published')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        const formattedItems: RecentlyAddedItem[] = data.map(video => ({
          id: video.id,
          title: video.title,
          image: video.thumbnail_url || '/api/placeholder/400/600',
          rating: video.rating || 0,
          year: video.year || 2024,
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

        setRecentItems(formattedItems);
      } catch (error) {
        console.error('Error fetching recently added content:', error);
        toast({
          title: "Error",
          description: "Failed to load recently added content",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyAdded();
  }, [toast]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded mb-4 w-48"></div>
        <div className="flex space-x-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-64 h-96 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (recentItems.length === 0) return null;

  return (
    <ContentCarousel
      title="Recently Added"
      items={recentItems}
    />
  );
};

export default RecentlyAddedSection;