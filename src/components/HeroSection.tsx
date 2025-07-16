import { useState } from 'react';
import { Play, Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VideoPlayer from '@/components/VideoPlayer';
import heroImage from '@/assets/hero-featured.jpg';

const HeroSection = () => {
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  return (
    <section className="relative h-screen flex items-center justify-start overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Featured Content" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-16">
        <div className="max-w-2xl pt-20">
          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 text-shadow">
            Shadow Hunter
          </h1>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-white mb-8 leading-relaxed text-shadow max-w-lg">
            In a world where darkness threatens to consume everything, one warrior stands 
            between hope and despair. Join the epic journey of courage, sacrifice, and 
            ultimate redemption.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 mb-8">
            <button 
              className="btn-netflix-play"
              onClick={() => setIsVideoPlayerOpen(true)}
            >
              <Play className="w-6 h-6 fill-current" />
              Play
            </button>
            
            <button 
              className="btn-netflix-info"
              onClick={() => {
                console.log('Show more info');
                // TODO: Implement more info modal
              }}
            >
              <Info className="w-6 h-6" />
              More Info
            </button>
          </div>

          {/* Metadata */}
          <div className="flex items-center space-x-4 text-sm text-gray-300">
            <span className="bg-gray-700 px-2 py-1 rounded text-white font-medium">
              TV-MA
            </span>
            <span>2024</span>
            <span>Action • Adventure • Fantasy</span>
            <span>2h 18m</span>
            <span className="flex items-center">
              <span className="text-yellow-400 mr-1">★</span>
              8.9
            </span>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <VideoPlayer
        title="Shadow Hunter"
        isOpen={isVideoPlayerOpen}
        onClose={() => setIsVideoPlayerOpen(false)}
      />
    </section>
  );
};

export default HeroSection;