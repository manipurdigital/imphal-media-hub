import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import ContentCard from '@/components/ContentCard';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  rating: number;
  year: number;
  genre: string;
  duration: number;
  director: string;
  cast_members: string[];
  content_type: string;
  trailer_url: string;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

const TVShows = () => {
  const [shows, setShows] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchTVShows();
  }, [user, navigate]);

  const fetchTVShows = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          categories:video_categories!inner(
            categories(id, name, slug)
          )
        `)
        .eq('content_type', 'series')
        .eq('content_status', 'published');

      if (error) throw error;

      const formattedShows = data?.map(video => ({
        ...video,
        categories: video.categories.map((vc: any) => vc.categories).filter(Boolean)
      })) || [];

      setShows(formattedShows);
    } catch (error) {
      console.error('Error fetching TV shows:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading TV Shows...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">TV Shows</h1>
          
          {shows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No TV shows available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {shows.map((show) => (
                <ContentCard
                  key={show.id}
                  id={show.id}
                  title={show.title}
                  image={show.thumbnail_url || '/placeholder.svg'}
                  rating={show.rating || 0}
                  year={show.year || 0}
                  genre={show.genre}
                  duration={formatDuration(show.duration)}
                  description={show.description}
                  videoUrl={show.video_url}
                  castMembers={show.cast_members || []}
                  director={show.director}
                  contentType={show.content_type}
                  categories={show.categories}
                  trailerUrl={show.trailer_url}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TVShows;