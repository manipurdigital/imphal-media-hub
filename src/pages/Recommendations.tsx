import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useFavorites } from '@/hooks/useFavorites';
import RecommendationSection from '@/components/RecommendationSection';
import Navigation from '@/components/Navigation';

const Recommendations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { recommendations, loading, fetchRecommendations } = useRecommendations();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  const handleVideoSelect = (video: any) => {
    // Navigate to video player or video details page
    console.log('Selected video:', video);
    // You can navigate to a video player page here
    toast({
      title: 'Playing Video',
      description: `Now playing: ${video.title}`,
    });
  };

  const handleAddToList = async (videoId: string) => {
    try {
      if (isFavorite(videoId)) {
        await removeFromFavorites(videoId);
        toast({
          title: 'Removed from List',
          description: 'Video removed from your list',
        });
      } else {
        await addToFavorites(videoId);
        toast({
          title: 'Added to List',
          description: 'Video added to your list',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update your list',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = () => {
    fetchRecommendations();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Recommendations
              </h1>
              <p className="text-muted-foreground">
                Discover content tailored just for you
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {/* Loading State */}
        {loading && recommendations.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">
                Loading personalized recommendations...
              </p>
            </div>
          </div>
        )}

        {/* Recommendations Sections */}
        {recommendations.length > 0 && (
          <div className="space-y-12">
            {recommendations.map((section, index) => (
              <RecommendationSection
                key={index}
                section={section}
                onVideoSelect={handleVideoSelect}
                onAddToList={handleAddToList}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && recommendations.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">
              No Recommendations Yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Start watching content to get personalized recommendations
            </p>
            <Button onClick={() => navigate('/')}>
              Browse Content
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Recommendations;