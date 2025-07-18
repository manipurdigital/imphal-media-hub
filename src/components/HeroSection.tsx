import React, { useState } from 'react';
import { Play, Info } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-featured.jpg';

const HeroSection: React.FC = () => {
  const [showPlayer, setShowPlayer] = useState(false);

  // Fetch featured video
  const { data: featuredVideo } = useQuery({
    queryKey: ['featured-video'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('is_featured', true)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      return data;
    },
  });

  // Use featured video data if available, fallback to default
  const displayVideo = featuredVideo || {
    title: "Shadow Hunter",
    description: "In a world where darkness threatens to consume everything, one warrior stands between hope and despair. Join the epic journey of courage and redemption.",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail_url: null,
    year: 2024,
    rating: null
  };

  const backgroundImage = featuredVideo?.thumbnail_url || heroImage;

  return (
    <section className="relative h-screen flex items-center justify-start bg-black">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-16 text-white pt-20">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-none">
          {displayVideo.title}
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed max-w-lg">
          {displayVideo.description}
        </p>
        
        {/* Metadata */}
        <div className="flex items-center space-x-4 mb-10 text-lg">
          {featuredVideo?.rating && (
            <span className="text-green-400 font-semibold">{Math.round(featuredVideo.rating * 10)}% Match</span>
          )}
          <span className="border border-white/40 px-2 py-1 text-sm">
            {featuredVideo?.content_type === 'series' ? 'TV' : 'Movie'}
          </span>
          {displayVideo.year && <span>{displayVideo.year}</span>}
          {featuredVideo?.content_type === 'series' && (
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
      
      {/* Video Player Modal */}
      <VideoPlayer
        title={displayVideo.title}
        isOpen={showPlayer}
        onClose={() => setShowPlayer(false)}
        videoUrl={displayVideo.video_url}
      />
    </section>
  );
};

export default HeroSection;