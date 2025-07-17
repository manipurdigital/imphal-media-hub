import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SearchSuggestions from '@/components/SearchSuggestions';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchSectionProps {
  onSearch: (query: string, filters?: any) => void;
  placeholder?: string;
}

const SearchSection: React.FC<SearchSectionProps> = ({ 
  onSearch, 
  placeholder = "Search movies, shows, documentaries..." 
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  // Auto-search when user stops typing
  useEffect(() => {
    if (debouncedQuery.trim() && debouncedQuery.length >= 2) {
      onSearch(debouncedQuery.trim());
    }
  }, [debouncedQuery, onSearch]);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="w-full bg-background/50 backdrop-blur-sm py-6 mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowSuggestions(query.length > 0)}
                className="w-full pl-12 pr-4 py-3 text-base bg-background/80 border-2 border-border/30 rounded-lg focus:border-primary/50 focus:bg-background transition-all duration-200"
                autoComplete="off"
              />
              <SearchSuggestions
                query={query}
                onSelect={handleSuggestionSelect}
                onClose={() => setShowSuggestions(false)}
                isVisible={showSuggestions}
              />
            </div>
            <Button
              onClick={handleSearch}
              className="px-8 py-3 text-base font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-all duration-200 hover:scale-105"
            >
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchSection;