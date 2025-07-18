import React, { useState, useEffect } from 'react';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-featured.jpg';

const HeroSection: React.FC = () => {
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch all featured videos
  const { data: featuredVideos = [] } = useQuery({
    queryKey: ['featured-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('is_featured', true)
        .eq('content_status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Auto-slide functionality
  useEffect(() => {
    if (featuredVideos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === featuredVideos.length - 1 ? 0 : prevIndex + 1
      );
    }, 8000); // Change slide every 8 seconds

    return () => clearInterval(interval);
  }, [featuredVideos.length]);

  // Navigation functions
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === featuredVideos.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? featuredVideos.length - 1 : prevIndex - 1
    );
  };

  // Get current video or fallback
  const currentVideo = featuredVideos[currentIndex] || {
    title: "Shadow Hunter",
    description: "In a world where darkness threatens to consume everything, one warrior stands between hope and despair. Join the epic journey of courage and redemption.",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail_url: null,
    year: 2024,
    rating: null,
    content_type: 'movie',
    is_featured: false
  };

  const backgroundImage = currentVideo?.thumbnail_url || heroImage;

  return (
    <section className="relative h-screen flex items-center justify-start bg-black overflow-hidden">
      {/* Background Images with Transition */}
      {featuredVideos.length > 0 ? (
        featuredVideos.map((video, index) => (
          <div
            key={video.id}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${video.thumbnail_url || heroImage})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
          </div>
        ))
      ) : (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${heroImage})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
        </div>
      )}

      {/* Navigation Arrows */}
      {featuredVideos.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            aria-label="Previous video"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            aria-label="Next video"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-16 text-white pt-20">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-none transition-all duration-500">
          {currentVideo.title}
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed max-w-lg transition-all duration-500">
          {currentVideo.description}
        </p>
        
        {/* Metadata */}
        <div className="flex items-center space-x-4 mb-10 text-lg">
          {currentVideo?.rating && (
            <span className="text-green-400 font-semibold">{Math.round(currentVideo.rating * 10)}% Match</span>
          )}
          <span className="border border-white/40 px-2 py-1 text-sm">
            {currentVideo?.content_type === 'series' ? 'TV' : 'Movie'}
          </span>
          {currentVideo.year && <span>{currentVideo.year}</span>}
          {currentVideo?.content_type === 'series' && (
            <span className="border-l border-white/40 pl-4">Series</span>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <button 
            className="btn-netflix-play text-lg px-8 py-3"
            onClick={() => setShowPlayer(true)}
          >
            <Play className="w-7 h-7" fill="currentColor" />
            Play
          </button>
          <button 
            className="btn-netflix-info text-lg px-8 py-3"
          >
            <Info className="w-7 h-7" />
            More Info
          </button>
        </div>
      </div>

      {/* Slide Indicators */}
      {featuredVideos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex space-x-2">
            {featuredVideos.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-white scale-110' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Video Player Modal */}
      <VideoPlayer
        title={currentVideo.title}
        isOpen={showPlayer}
        onClose={() => setShowPlayer(false)}
        videoUrl={currentVideo.video_url}
      />
    </section>
  );
};

export default HeroSection;