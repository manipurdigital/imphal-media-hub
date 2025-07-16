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

const MyList = () => {
  const [favorites, setFavorites] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchFavorites();
  }, [user, navigate]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          videos (
            *,
            categories:video_categories!inner(
              categories(id, name, slug)
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formattedFavorites = data?.map(fav => ({
        ...fav.videos,
        categories: fav.videos.categories.map((vc: any) => vc.categories).filter(Boolean)
      })) || [];

      setFavorites(formattedFavorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
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
            <p className="text-muted-foreground">Loading Your List...</p>
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
          <h1 className="text-3xl font-bold text-foreground mb-8">My List</h1>
          
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <p className="text-muted-foreground text-lg mb-4">Your list is empty</p>
                <p className="text-sm text-muted-foreground">
                  Browse content and click the "+" button to add movies and shows to your list.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {favorites.map((video) => (
                <ContentCard
                  key={video.id}
                  id={video.id}
                  title={video.title}
                  image={video.thumbnail_url || '/placeholder.svg'}
                  rating={video.rating || 0}
                  year={video.year || 0}
                  genre={video.genre}
                  duration={formatDuration(video.duration)}
                  description={video.description}
                  videoUrl={video.video_url}
                  castMembers={video.cast_members || []}
                  director={video.director}
                  contentType={video.content_type}
                  categories={video.categories}
                  trailerUrl={video.trailer_url}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyList;