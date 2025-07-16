import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('video_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setFavorites(data.map(fav => fav.video_id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const addToFavorites = async (videoId: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to add items to your list.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          video_id: videoId,
        });

      if (error) throw error;

      setFavorites(prev => [...prev, videoId]);
      toast({
        title: 'Added to My List',
        description: 'Item has been added to your list.',
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item to your list.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (videoId: string) => {
    if (!user) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);

      if (error) throw error;

      setFavorites(prev => prev.filter(id => id !== videoId));
      toast({
        title: 'Removed from My List',
        description: 'Item has been removed from your list.',
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item from your list.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFavorite = (videoId: string) => favorites.includes(videoId);

  const toggleFavorite = async (videoId: string) => {
    if (isFavorite(videoId)) {
      await removeFromFavorites(videoId);
    } else {
      await addToFavorites(videoId);
    }
  };

  return {
    favorites,
    loading,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
  };
};