import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  title: string;
  videoUrl?: string;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayer = ({ title, videoUrl, isOpen, onClose }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [isOpen]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoClick = () => {
    togglePlay();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Video Container */}
      <div className="relative w-full h-full">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Video Element */}
        {videoUrl ? (
          <video
            ref={videoRef}
            className="w-full h-full object-contain cursor-pointer"
            onClick={handleVideoClick}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-4">{title}</h2>
              <p className="text-gray-400 mb-8">Video content will be available soon</p>
              <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Video Controls */}
        {videoUrl && (
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
            onMouseEnter={() => setShowControls(true)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </Button>

                <h3 className="text-white font-semibold">{title}</h3>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.requestFullscreen();
                  }
                }}
              >
                <Maximize className="w-6 h-6" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;