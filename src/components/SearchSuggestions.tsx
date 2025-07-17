import { useState, useEffect, useRef } from 'react';
import { Search, Clock, TrendingUp, Film, Tv, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

interface SearchSuggestion {
  type: 'history' | 'trending' | 'content' | 'genre';
  value: string;
  meta?: {
    icon?: any;
    label?: string;
    count?: number;
  };
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  query,
  onSelect,
  onClose,
  isVisible
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && query.length > 0) {
      fetchSuggestions(query);
    } else if (isVisible && query.length === 0) {
      fetchDefaultSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [query, isVisible]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const fetchSuggestions = async (searchQuery: string) => {
    setLoading(true);
    try {
      const suggestions: SearchSuggestion[] = [];

      // Fetch content suggestions
      const { data: contentData } = await supabase
        .from('videos')
        .select('title, content_type')
        .ilike('title', `%${searchQuery}%`)
        .eq('content_status', 'published')
        .limit(5);

      if (contentData) {
        contentData.forEach(item => {
          suggestions.push({
            type: 'content',
            value: item.title,
            meta: {
              icon: item.content_type === 'movie' ? Film : Tv,
              label: item.content_type
            }
          });
        });
      }

      // Fetch genre suggestions
      const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller'];
      const matchingGenres = genres.filter(genre => 
        genre.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      matchingGenres.forEach(genre => {
        suggestions.push({
          type: 'genre',
          value: genre,
          meta: {
            icon: Star,
            label: 'Genre'
          }
        });
      });

      setSuggestions(suggestions.slice(0, 8));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaultSuggestions = async () => {
    setLoading(true);
    try {
      const suggestions: SearchSuggestion[] = [];

      // Fetch search history if user is logged in
      if (user) {
        const { data: historyData } = await supabase
          .from('search_history')
          .select('search_query')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (historyData) {
          historyData.forEach(item => {
            suggestions.push({
              type: 'history',
              value: item.search_query,
              meta: {
                icon: Clock,
                label: 'Recent search'
              }
            });
          });
        }
      }

      // Add trending suggestions
      const trendingTerms = ['Action Movies', 'New Releases', 'Top Rated', 'Documentary'];
        trendingTerms.forEach(term => {
          suggestions.push({
            type: 'trending',
            value: term,
            meta: {
              icon: TrendingUp,
              label: 'Trending'
            }
          });
        });

      setSuggestions(suggestions.slice(0, 6));
    } catch (error) {
      console.error('Error fetching default suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (suggestion: SearchSuggestion) => {
    onSelect(suggestion.value);
    onClose();
  };

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={suggestionRef}
      className="absolute top-full left-0 right-0 z-50 mt-2 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-xl max-h-96 overflow-y-auto animate-fade-in"
    >
      <div className="p-2">
        {suggestions.map((suggestion, index) => {
          const IconComponent = suggestion.meta?.icon || Search;
          return (
            <div
              key={`${suggestion.type}-${index}`}
              onClick={() => handleSelect(suggestion)}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent/10 transition-colors group"
            >
              <IconComponent className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="flex-1">
                <span className="text-sm font-medium">{suggestion.value}</span>
                {suggestion.meta?.label && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {suggestion.meta.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchSuggestions;