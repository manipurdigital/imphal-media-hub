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

const Movies = () => {
  const [movies, setMovies] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchMovies();
  }, [user, navigate]);

  const fetchMovies = async () => {
    try {
      const { data, error } = await supabase
        .from('videos_browse')
        .select(`
          *,
          categories:video_categories!inner(
            categories(id, name, slug)
          )
        `)
        .eq('content_type', 'movie')
        .eq('content_status', 'published')
        .is('deleted_at', null);

      if (error) throw error;

      const formattedMovies = data?.map(video => ({
        ...video,
        categories: video.categories.map((vc: any) => vc.categories).filter(Boolean)
      })) || [];

      setMovies(formattedMovies);
    } catch (error) {
      console.error('Error fetching movies:', error);
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
            <p className="text-muted-foreground">Loading Movies...</p>
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
          <h1 className="text-3xl font-bold text-foreground mb-8">Movies</h1>
          
          {movies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No movies available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {movies.map((movie) => (
                <ContentCard
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  image={movie.thumbnail_url || '/placeholder.svg'}
                  rating={movie.rating || 0}
                  year={movie.year || 0}
                  genre={movie.genre}
                  duration={formatDuration(movie.duration)}
                  description={movie.description}
                  videoUrl={movie.video_url}
                  castMembers={movie.cast_members || []}
                  director={movie.director}
                  contentType={movie.content_type}
                  categories={movie.categories}
                  trailerUrl={movie.trailer_url}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Movies;