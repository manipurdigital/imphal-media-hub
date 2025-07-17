import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { VideoRecommendation, RecommendationSection as RecommendationSectionType } from '@/hooks/useRecommendations';

interface RecommendationSectionProps {
  section: RecommendationSectionType;
  onVideoSelect?: (video: VideoRecommendation) => void;
  onAddToList?: (videoId: string) => void;
}

const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  section,
  onVideoSelect,
  onAddToList
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 6;
  const maxIndex = Math.max(0, section.videos.length - itemsPerPage);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + itemsPerPage, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - itemsPerPage, 0));
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getTypeIcon = (type: string) => {
    const iconClass = "h-3 w-3";
    switch (type) {
      case 'personal':
        return <Star className={iconClass} />;
      case 'trending':
        return <Play className={iconClass} />;
      case 'new':
        return <Clock className={iconClass} />;
      default:
        return null;
    }
  };

  if (section.videos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getTypeIcon(section.type)}
          <div>
            <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </div>
        </div>
        
        {/* Navigation Controls */}
        {section.videos.length > itemsPerPage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Video Grid */}
      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-in-out gap-4"
          style={{ transform: `translateX(-${(currentIndex / itemsPerPage) * 100}%)` }}
        >
          {section.videos.map((video, index) => (
            <Card 
              key={video.id}
              className="flex-shrink-0 w-64 group cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-xl"
              onClick={() => onVideoSelect?.(video)}
            >
              <CardContent className="p-0">
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={video.thumbnail_url || '/placeholder-video.jpg'}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Content Type Badge */}
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 left-2 text-xs capitalize bg-black/70 text-white"
                  >
                    {video.content_type}
                  </Badge>

                  {/* Rating */}
                  {video.rating && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{video.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Content Info */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm line-clamp-2 flex-1">
                      {video.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToList?.(video.id);
                      }}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {video.year && <span>{video.year}</span>}
                    {video.duration && (
                      <>
                        <span>•</span>
                        <span>{formatDuration(video.duration)}</span>
                      </>
                    )}
                    {video.genre && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{video.genre.split(',')[0]}</span>
                      </>
                    )}
                  </div>

                  {/* Recommendation Reason */}
                  {video.reason && (
                    <div className="text-xs text-primary/80 font-medium">
                      {video.reason}
                    </div>
                  )}

                  {/* Description */}
                  {video.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {video.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Progress Indicator */}
      {section.videos.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: Math.ceil(section.videos.length / itemsPerPage) }).map((_, index) => (
            <div
              key={index}
              className={`h-1 w-8 rounded-full transition-colors duration-300 ${
                Math.floor(currentIndex / itemsPerPage) === index 
                  ? 'bg-primary' 
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationSection;