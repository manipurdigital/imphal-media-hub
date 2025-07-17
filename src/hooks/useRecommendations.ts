import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VideoRecommendation {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  genre: string;
  year: number;
  rating: number;
  duration: number;
  content_type: string;
  view_count: number;
  reason?: string; // Why this video was recommended
  score?: number; // Recommendation score
}

export interface RecommendationSection {
  title: string;
  description: string;
  videos: VideoRecommendation[];
  type: 'trending' | 'similar' | 'genre' | 'new' | 'personal';
}

export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState<RecommendationSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const sections: RecommendationSection[] = [];

      // 1. Trending/Popular Videos
      const { data: trendingData } = await supabase
        .from('videos')
        .select('*')
        .eq('content_status', 'published')
        .order('view_count', { ascending: false })
        .limit(10);

      if (trendingData && trendingData.length > 0) {
        sections.push({
          title: 'Trending Now',
          description: 'Most watched content this week',
          type: 'trending',
          videos: trendingData.map(video => ({
            ...video,
            reason: 'Trending content',
            score: video.view_count || 0
          }))
        });
      }

      // 2. New Releases
      const { data: newData } = await supabase
        .from('videos')
        .select('*')
        .eq('content_status', 'published')
        .order('created_at', { ascending: false })
        .limit(10);

      if (newData && newData.length > 0) {
        sections.push({
          title: 'New Releases',
          description: 'Latest additions to our catalog',
          type: 'new',
          videos: newData.map(video => ({
            ...video,
            reason: 'Recently added',
            score: Date.now() - new Date(video.created_at).getTime()
          }))
        });
      }

      // 3. Top Rated
      const { data: topRatedData } = await supabase
        .from('videos')
        .select('*')
        .eq('content_status', 'published')
        .not('rating', 'is', null)
        .order('rating', { ascending: false })
        .limit(10);

      if (topRatedData && topRatedData.length > 0) {
        sections.push({
          title: 'Top Rated',
          description: 'Highest rated content',
          type: 'trending',
          videos: topRatedData.map(video => ({
            ...video,
            reason: 'Highly rated',
            score: video.rating || 0
          }))
        });
      }

      // 4. Personal Recommendations (if user is logged in)
      if (user) {
        await fetchPersonalRecommendations(sections);
      }

      // 5. Genre-based recommendations
      const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance'];
      for (const genre of genres.slice(0, 2)) {
        const { data: genreData } = await supabase
          .from('videos')
          .select('*')
          .eq('content_status', 'published')
          .ilike('genre', `%${genre}%`)
          .order('rating', { ascending: false })
          .limit(8);

        if (genreData && genreData.length > 0) {
          sections.push({
            title: `${genre} Movies & Shows`,
            description: `Best ${genre.toLowerCase()} content`,
            type: 'genre',
            videos: genreData.map(video => ({
              ...video,
              reason: `${genre} recommendation`,
              score: video.rating || 0
            }))
          });
        }
      }

      setRecommendations(sections);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonalRecommendations = async (sections: RecommendationSection[]) => {
    if (!user) return;

    try {
      // Get user's viewing history
      const { data: viewingHistory } = await supabase
        .from('viewing_history')
        .select(`
          video_id,
          watch_percentage,
          videos (
            id,
            title,
            genre,
            content_type
          )
        `)
        .eq('user_id', user.id)
        .gte('watch_percentage', 50) // Only consider videos watched more than 50%
        .order('last_watched_at', { ascending: false })
        .limit(10);

      if (viewingHistory && viewingHistory.length > 0) {
        // Extract genres from watched content
        const watchedGenres = new Set<string>();
        viewingHistory.forEach(history => {
          if (history.videos && history.videos.genre) {
            history.videos.genre.split(',').forEach(g => watchedGenres.add(g.trim()));
          }
        });

        // Get recommendations based on watched genres
        if (watchedGenres.size > 0) {
          const genreArray = Array.from(watchedGenres);
          const { data: similarData } = await supabase
            .from('videos')
            .select('*')
            .eq('content_status', 'published')
            .or(genreArray.map(genre => `genre.ilike.%${genre}%`).join(','))
            .not('id', 'in', `(${viewingHistory.map(h => h.video_id).join(',')})`)
            .order('rating', { ascending: false })
            .limit(10);

          if (similarData && similarData.length > 0) {
            sections.unshift({
              title: 'Recommended for You',
              description: 'Based on your viewing history',
              type: 'personal',
              videos: similarData.map(video => ({
                ...video,
                reason: 'Based on your interests',
                score: video.rating || 0
              }))
            });
          }
        }

        // Continue watching section
        const continueWatching = viewingHistory
          .filter(history => history.watch_percentage < 90)
          .map(history => ({
            ...history.videos!,
            reason: `${Math.round(history.watch_percentage)}% watched`,
            score: history.watch_percentage
          }))
          .filter(video => video.id) as VideoRecommendation[];

        if (continueWatching.length > 0) {
          sections.unshift({
            title: 'Continue Watching',
            description: 'Pick up where you left off',
            type: 'personal',
            videos: continueWatching
          });
        }
      }

      // Get user's favorites for similar content
      const { data: favorites } = await supabase
        .from('user_favorites')
        .select(`
          videos (
            id,
            title,
            genre,
            content_type
          )
        `)
        .eq('user_id', user.id)
        .limit(5);

      if (favorites && favorites.length > 0) {
        const favoriteGenres = new Set<string>();
        favorites.forEach(fav => {
          if (fav.videos && fav.videos.genre) {
            fav.videos.genre.split(',').forEach(g => favoriteGenres.add(g.trim()));
          }
        });

        if (favoriteGenres.size > 0) {
          const genreArray = Array.from(favoriteGenres);
          const { data: similarToFavorites } = await supabase
            .from('videos')
            .select('*')
            .eq('content_status', 'published')
            .or(genreArray.map(genre => `genre.ilike.%${genre}%`).join(','))
            .not('id', 'in', `(${favorites.map(f => f.videos!.id).join(',')})`)
            .order('rating', { ascending: false })
            .limit(8);

          if (similarToFavorites && similarToFavorites.length > 0) {
            sections.push({
              title: 'More Like Your Favorites',
              description: 'Similar to content you loved',
              type: 'similar',
              videos: similarToFavorites.map(video => ({
                ...video,
                reason: 'Similar to your favorites',
                score: video.rating || 0
              }))
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching personal recommendations:', error);
    }
  };

  const getRecommendationsByGenre = async (genre: string) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('content_status', 'published')
        .ilike('genre', `%${genre}%`)
        .order('rating', { ascending: false })
        .limit(20);

      return data?.map(video => ({
        ...video,
        reason: `${genre} recommendation`,
        score: video.rating || 0
      })) || [];
    } catch (error) {
      console.error('Error fetching genre recommendations:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getSimilarContent = async (videoId: string) => {
    setLoading(true);
    try {
      // Get the source video to find similar content
      const { data: sourceVideo } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (!sourceVideo) return [];

      // Find similar videos based on genre and content type
      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('content_status', 'published')
        .eq('content_type', sourceVideo.content_type)
        .ilike('genre', `%${sourceVideo.genre}%`)
        .neq('id', videoId)
        .order('rating', { ascending: false })
        .limit(10);

      return data?.map(video => ({
        ...video,
        reason: 'Similar content',
        score: video.rating || 0
      })) || [];
    } catch (error) {
      console.error('Error fetching similar content:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const recordViewingHistory = async (videoId: string, watchDuration: number, totalDuration: number) => {
    if (!user) return;

    try {
      const watchPercentage = (watchDuration / totalDuration) * 100;
      
      await supabase
        .from('viewing_history')
        .upsert({
          user_id: user.id,
          video_id: videoId,
          watch_duration: watchDuration,
          total_duration: totalDuration,
          watch_percentage: Math.min(watchPercentage, 100),
          last_watched_at: new Date().toISOString()
        }, { onConflict: 'user_id,video_id' });
    } catch (error) {
      console.error('Error recording viewing history:', error);
    }
  };

  const recordSearchHistory = async (searchQuery: string, resultsCount: number, clickedVideoId?: string) => {
    if (!user || !searchQuery.trim()) return;

    try {
      await supabase
        .from('search_history')
        .insert({
          user_id: user.id,
          search_query: searchQuery.trim(),
          results_count: resultsCount,
          clicked_video_id: clickedVideoId
        });
    } catch (error) {
      console.error('Error recording search history:', error);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  return {
    recommendations,
    loading,
    error,
    fetchRecommendations,
    getRecommendationsByGenre,
    getSimilarContent,
    recordViewingHistory,
    recordSearchHistory
  };
};