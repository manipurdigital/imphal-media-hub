import React, { useState } from 'react';
import { Play, Info } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import heroImage from '@/assets/hero-featured.jpg';

const HeroSection: React.FC = () => {
  const [showPlayer, setShowPlayer] = useState(false);

  return (
    <section className="relative h-screen flex items-center justify-start bg-black">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-16 text-white pt-20">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-none">
          Shadow Hunter
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed max-w-lg">
          In a world where darkness threatens to consume everything, one warrior stands 
          between hope and despair. Join the epic journey of courage and redemption.
        </p>
        
        {/* Metadata */}
        <div className="flex items-center space-x-4 mb-10 text-lg">
          <span className="text-green-400 font-semibold">98% Match</span>
          <span className="border border-white/40 px-2 py-1 text-sm">TV-MA</span>
          <span>2024</span>
          <span className="border-l border-white/40 pl-4">3 Seasons</span>
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
        title="Shadow Hunter"
        isOpen={showPlayer}
        onClose={() => setShowPlayer(false)}
        videoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
      />
    </section>
  );
};

export default HeroSection;