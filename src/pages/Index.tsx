import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import ContentCarousel from '@/components/ContentCarousel';
import SearchSection from '@/components/SearchSection';
import { useVideoSearch, VideoSearchResult } from '@/hooks/useVideoSearch';
import { useCollections } from '@/hooks/useCollections';
import { useCategories } from '@/hooks/useCategories';
import ImoinuOriginalsSection from '@/components/ImoinuOriginalsSection';
import TrendingSection from '@/components/TrendingSection';
import RecentlyAddedSection from '@/components/RecentlyAddedSection';
import TopRatedSection from '@/components/TopRatedSection';
import PremiumPPVSection from '@/components/PremiumPPVSection';
import movie1 from '@/assets/movie-1.jpg';
import movie2 from '@/assets/movie-2.jpg';
import movie3 from '@/assets/movie-3.jpg';
import movie4 from '@/assets/movie-4.jpg';
import movie5 from '@/assets/movie-5.jpg';

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
  castMembers?: string[];
  director?: string;
  contentType?: string;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  trailerUrl?: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { 
    videos, 
    loading, 
    error, 
    searchVideos, 
    getVideosByCollection, 
    getAllVideos 
  } = useVideoSearch();
  const { featuredCollections } = useCollections();
  const { categories } = useCategories();

  useEffect(() => {
    getAllVideos();
  }, []);

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const convertVideoToContentItem = (video: VideoSearchResult): ContentItem => {
    // Map thumbnail URLs to imported images for static assets only
    const imageMap: { [key: string]: string } = {
      '/src/assets/movie-1.jpg': movie1,
      '/src/assets/movie-2.jpg': movie2,
      '/src/assets/movie-3.jpg': movie3,
      '/src/assets/movie-4.jpg': movie4,
      '/src/assets/movie-5.jpg': movie5,
    };

    // Use the actual thumbnail URL if it exists, otherwise check static assets map
    const getThumbnailImage = (thumbnailUrl: string | null): string => {
      if (!thumbnailUrl) return '/placeholder.svg';
      
      // If it's a static asset path, use the imported image
      if (imageMap[thumbnailUrl]) {
        return imageMap[thumbnailUrl];
      }
      
      // Otherwise use the URL directly (for external URLs like Supabase Storage or Unsplash)
      return thumbnailUrl;
    };

    return {
      id: video.id,
      title: video.title,
      image: getThumbnailImage(video.thumbnail_url),
      rating: video.rating || 7.5,
      year: video.production_year || video.year || 2024,
      genre: video.genre,
      duration: formatDuration(video.duration),
      description: video.description || 'No description available.',
      videoUrl: video.video_url,
      castMembers: video.cast_members || [],
      director: video.director,
      contentType: video.content_type,
      categories: video.categories || [],
      trailerUrl: video.trailer_url
    };
  };

  const handleSearch = (query: string, filters?: any) => {
    setSearchQuery(query);
    setShowSearch(true);
    searchVideos(query, filters);
  };

  const handleCollectionClick = (collectionSlug: string) => {
    setShowSearch(false);
    getVideosByCollection(collectionSlug);
  };

  const handleBackToHome = () => {
    setShowSearch(false);
    setSearchQuery('');
    getAllVideos();
  };

  // Group videos by different criteria
  const allVideos = videos.map(convertVideoToContentItem);
  const movieVideos = videos.filter(video => video.content_type === 'movie').map(convertVideoToContentItem);
  const seriesVideos = videos.filter(video => video.content_type === 'series').map(convertVideoToContentItem);
  const documentaryVideos = videos.filter(video => video.content_type === 'documentary').map(convertVideoToContentItem);
  
  // Group by categories
  const actionVideos = videos.filter(video => 
    video.categories.some(cat => cat.slug === 'action')
  ).map(convertVideoToContentItem);
  const comedyVideos = videos.filter(video => 
    video.categories.some(cat => cat.slug === 'comedy')
  ).map(convertVideoToContentItem);
  const dramaVideos = videos.filter(video => 
    video.categories.some(cat => cat.slug === 'drama')
  ).map(convertVideoToContentItem);

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

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="text-center mt-20">
          <p className="text-destructive text-lg">Error loading videos: {error}</p>
          <button 
            onClick={getAllVideos}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background cursor-pointer" 
      onClick={() => navigate('/auth?tab=signup')}
    >
      {/* Navigation */}
      <Navigation />

      {/* Search Section - Always visible */}
      <SearchSection onSearch={handleSearch} />

      {/* Hero Section */}
      {!showSearch && (
        <>
          <HeroSection />
          <PremiumPPVSection />
        </>
      )}

      {/* Search Results Info */}
      {showSearch && (
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <button 
              onClick={handleBackToHome}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              ← Back to Home
            </button>
            {searchQuery && (
              <span className="text-muted-foreground text-sm">
                Search results for "{searchQuery}"
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content Sections */}
      <div className="pb-12 space-y-12">
        {showSearch ? (
          // Search Results
          <>
            {allVideos.length > 0 ? (
              <ContentCarousel 
                title={searchQuery ? `Search Results (${allVideos.length})` : "Videos"} 
                items={allVideos} 
              />
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">No videos found.</p>
                <p className="text-muted-foreground text-sm mt-2">Try adjusting your search or filters.</p>
              </div>
            )}
          </>
        ) : (
          // Home Page Content
          <>
            {/* Enhanced Netflix-Style Sections */}
            <ImoinuOriginalsSection />
            <TrendingSection />
            <RecentlyAddedSection />
            <TopRatedSection />
            
            {/* Content by Type */}
            {movieVideos.length > 0 && (
              <ContentCarousel title="Movies" items={movieVideos} />
            )}
            {seriesVideos.length > 0 && (
              <ContentCarousel title="TV Shows & Series" items={seriesVideos} />
            )}
            {documentaryVideos.length > 0 && (
              <ContentCarousel title="Documentaries & Specials" items={documentaryVideos} />
            )}

            {/* Content by Category */}
            {actionVideos.length > 0 && (
              <ContentCarousel title="Action & Adventure" items={actionVideos} />
            )}
            {comedyVideos.length > 0 && (
              <ContentCarousel title="Comedy & Laughs" items={comedyVideos} />
            )}
            {dramaVideos.length > 0 && (
              <ContentCarousel title="Drama & Thrillers" items={dramaVideos} />
            )}
            
            {videos.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">No videos available at the moment.</p>
                <p className="text-muted-foreground text-sm mt-2">Check back later for new content!</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Netflix-Style Footer */}
      <footer className="bg-black/50 py-16 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Imoinu</h3>
              <p className="text-gray-400 text-sm">
                Your premier destination for entertainment inspired by Manipuri culture. Stream thousands of movies and shows.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Movies</a></li>
                <li><a href="#" className="hover:text-white transition-colors">TV Shows</a></li>
                <li><a href="#" className="hover:text-white transition-colors">My List</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2024 Imoinu OTT Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;