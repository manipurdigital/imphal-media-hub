import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import ContentCarousel from '@/components/ContentCarousel';
import { supabase } from '@/integrations/supabase/client';

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  genre: string;
  year: number | null;
  rating: number | null;
}

interface ContentItem {
  id: string;
  title: string;
  image: string;
  rating: number;
  year: number;
  genre: string;
  duration: string;
  description: string;
  videoUrl?: string;
}

const Index = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        return;
      }

      setVideos(data || []);
    } catch (error) {
      console.error('Error:', error);
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

  const convertVideoToContentItem = (video: Video): ContentItem => ({
    id: video.id,
    title: video.title,
    image: video.thumbnail_url || '/placeholder.svg',
    rating: video.rating || 7.5,
    year: video.year || 2024,
    genre: video.genre,
    duration: formatDuration(video.duration),
    description: video.description || 'No description available.',
    videoUrl: video.video_url
  });

  // Group videos by genre for different carousels
  const animationVideos = videos.filter(video => video.genre === 'Animation').map(convertVideoToContentItem);
  const fantasyVideos = videos.filter(video => video.genre === 'Fantasy').map(convertVideoToContentItem);
  const sciFiVideos = videos.filter(video => video.genre === 'Sci-Fi').map(convertVideoToContentItem);
  const allVideos = videos.map(convertVideoToContentItem);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navigation />
        <div className="text-center mt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <HeroSection />

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {allVideos.length > 0 && (
          <ContentCarousel title="All Videos" items={allVideos} />
        )}
        {animationVideos.length > 0 && (
          <ContentCarousel title="Animation" items={animationVideos} />
        )}
        {fantasyVideos.length > 0 && (
          <ContentCarousel title="Fantasy" items={fantasyVideos} />
        )}
        {sciFiVideos.length > 0 && (
          <ContentCarousel title="Sci-Fi" items={sciFiVideos} />
        )}
        
        {videos.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No videos available at the moment.</p>
            <p className="text-muted-foreground text-sm mt-2">Check back later for new content!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">KANGLEIPAK</h3>
              <p className="text-muted-foreground text-sm">
                Your premier destination for entertainment. Stream thousands of movies and shows.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Home</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Movies</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">TV Shows</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">My List</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 KANGLEIPAK OTT Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;