import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VideoSearchResult {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  year: number;
  genre: string;
  duration: number;
  rating: number;
  cast_members: string[];
  director: string;
  production_year: number;
  trailer_url: string;
  content_status: string;
  content_type: string;
  view_count: number;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  collections: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export const useVideoSearch = () => {
  const [videos, setVideos] = useState<VideoSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchVideos = async (query: string, filters?: {
    category?: string;
    collection?: string;
    content_type?: 'movie' | 'series' | 'documentary' | 'short' | 'trailer';
    year?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Search query:', query, 'Filters:', filters);
      
      let searchQuery = supabase
        .from('videos')
        .select(`
          *,
          video_categories (
            categories (
              id,
              name,
              slug
            )
          ),
          video_collections (
            collections (
              id,
              name,
              slug
            )
          ),
          video_tags (
            tags (
              id,
              name,
              slug
            )
          )
        `)
        .eq('content_status', 'published');

      // Full-text search
      if (query.trim()) {
        searchQuery = searchQuery.textSearch('search_vector', query, {
          type: 'websearch',
          config: 'english'
        });
      }

      // Apply filters
      if (filters?.content_type) {
        searchQuery = searchQuery.eq('content_type', filters.content_type);
      }

      if (filters?.year) {
        searchQuery = searchQuery.eq('production_year', filters.year);
      }

      const { data, error } = await searchQuery
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Supabase search error:', error);
        throw error;
      }

      console.log('Raw search results:', data);

      if (!data || data.length === 0) {
        console.log('No videos found');
        setVideos([]);
        return;
      }

      // Transform the data to match our interface
      const transformedData: VideoSearchResult[] = data.map((video: any) => ({
        ...video,
        categories: video.video_categories?.map((vc: any) => vc.categories).filter(Boolean) || [],
        collections: video.video_collections?.map((vc: any) => vc.collections).filter(Boolean) || [],
        tags: video.video_tags?.map((vt: any) => vt.tags).filter(Boolean) || []
      }));

      // Apply category filter after data transformation if needed
      let filteredData = transformedData;
      if (filters?.category) {
        filteredData = transformedData.filter(video => 
          video.categories.some(cat => cat.slug === filters.category)
        );
      }

      // Apply collection filter after data transformation if needed
      if (filters?.collection) {
        filteredData = filteredData.filter(video => 
          video.collections.some(col => col.slug === filters.collection)
        );
      }

      console.log('Transformed and filtered results:', filteredData);
      setVideos(filteredData);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const getVideosByCollection = async (collectionSlug: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          video_categories (
            categories (
              id,
              name,
              slug
            )
          ),
          video_collections!inner (
            collections!inner (
              id,
              name,
              slug
            )
          ),
          video_tags (
            tags (
              id,
              name,
              slug
            )
          )
        `)
        .eq('content_status', 'published')
        .eq('video_collections.collections.slug', collectionSlug)
        .order('video_collections.display_order', { ascending: true });

      if (error) throw error;

      const transformedData: VideoSearchResult[] = data?.map((video: any) => ({
        ...video,
        categories: video.video_categories?.map((vc: any) => vc.categories).filter(Boolean) || [],
        collections: video.video_collections?.map((vc: any) => vc.collections).filter(Boolean) || [],
        tags: video.video_tags?.map((vt: any) => vt.tags).filter(Boolean) || []
      })) || [];

      setVideos(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getAllVideos = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          video_categories (
            categories (
              id,
              name,
              slug
            )
          ),
          video_collections (
            collections (
              id,
              name,
              slug
            )
          ),
          video_tags (
            tags (
              id,
              name,
              slug
            )
          )
        `)
        .eq('content_status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData: VideoSearchResult[] = data?.map((video: any) => ({
        ...video,
        categories: video.video_categories?.map((vc: any) => vc.categories).filter(Boolean) || [],
        collections: video.video_collections?.map((vc: any) => vc.collections).filter(Boolean) || [],
        tags: video.video_tags?.map((vt: any) => vt.tags).filter(Boolean) || []
      })) || [];

      setVideos(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return {
    videos,
    loading,
    error,
    searchVideos,
    getVideosByCollection,
    getAllVideos
  };
};