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
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 text-shadow text-glow animate-slide-up">
            Shadow Hunter
          </h1>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed text-shadow animate-slide-up" 
             style={{ animationDelay: '0.2s' }}>
            In a world where darkness threatens to consume everything, one warrior stands 
            between hope and despair. Join the epic journey of courage, sacrifice, and 
            ultimate redemption.
          </p>

          {/* Metadata */}
          <div className="flex items-center space-x-6 mb-8 text-sm text-gray-300 animate-slide-up" 
               style={{ animationDelay: '0.4s' }}>
            <span className="bg-primary px-3 py-1 rounded-full text-primary-foreground font-semibold glow-effect">
              2024
            </span>
            <span>Action • Adventure • Fantasy</span>
            <span>2h 18m</span>
            <span className="flex items-center glass-morphism px-3 py-1 rounded-full">
              <span className="text-yellow-400 mr-1">★</span>
              8.9
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 animate-slide-up" 
               style={{ animationDelay: '0.6s' }}>
            <Button 
              variant="gradient"
              size="xl"
              onClick={() => setIsVideoPlayerOpen(true)}
            >
              <Play className="w-5 h-5 mr-2" />
              Play Now
            </Button>
            
            <Button 
              variant="glass"
              size="xl"
              onClick={() => {
                console.log('Added to My List');
                // TODO: Implement add to list functionality
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              My List
            </Button>
            
            <Button 
              variant="glass"
              size="xl"
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
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-float">
        <div className="w-1 h-8 bg-gradient-to-b from-primary to-transparent rounded-full glow-effect" />
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