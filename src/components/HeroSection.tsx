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
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl animate-fade-in">
          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-2xl">
            Shadow Hunter
          </h1>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed drop-shadow-lg">
            In a world where darkness threatens to consume everything, one warrior stands 
            between hope and despair. Join the epic journey of courage, sacrifice, and 
            ultimate redemption.
          </p>

          {/* Metadata */}
          <div className="flex items-center space-x-6 mb-8 text-sm text-gray-300">
            <span className="bg-primary px-2 py-1 rounded text-primary-foreground font-semibold">
              2024
            </span>
            <span>Action • Adventure • Fantasy</span>
            <span>2h 18m</span>
            <span className="flex items-center">
              <span className="text-yellow-400 mr-1">★</span>
              8.9
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Button 
              className="btn-primary text-lg px-8 py-3"
              onClick={() => setIsVideoPlayerOpen(true)}
            >
              <Play className="w-5 h-5 mr-2" />
              Play Now
            </Button>
            
            <Button 
              className="btn-secondary text-lg px-8 py-3"
              onClick={() => {
                console.log('Added to My List');
                // TODO: Implement add to list functionality
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              My List
            </Button>
            
            <Button 
              variant="ghost" 
              className="text-white hover:text-primary border border-white/30 hover:border-primary px-8 py-3"
              onClick={() => {
                console.log('Show more info');
                // TODO: Implement more info modal
              }}
            >
              <Info className="w-5 h-5 mr-2" />
              More Info
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-1 h-8 bg-white/30 rounded-full" />
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