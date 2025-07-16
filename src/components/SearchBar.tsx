import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { useCategories } from '@/hooks/useCategories';
import { useCollections } from '@/hooks/useCollections';

interface SearchBarProps {
  onSearch: (query: string, filters?: {
    category?: string;
    collection?: string;
    content_type?: 'movie' | 'series' | 'documentary' | 'short' | 'trailer';
    year?: number;
  }) => void;
  placeholder?: string;
}

const SearchBar = ({ onSearch, placeholder = "Search movies, shows, actors..." }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<{
    category?: string;
    collection?: string;
    content_type?: 'movie' | 'series' | 'documentary' | 'short' | 'trailer';
    year?: number;
  }>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { categories } = useCategories();
  const { collections } = useCollections();

  const handleSearch = () => {
    onSearch(query, filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilter = (filterKey: string) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey as keyof typeof filters];
    setFilters(newFilters);
    onSearch(query, newFilters);
  };

  const updateFilter = (key: string, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(query, newFilters);
  };

  const activeFiltersCount = Object.keys(filters).length;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {/* Filter Button */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Filter className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <h4 className="font-medium">Filters</h4>
                
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={filters.category || ''} onValueChange={(value) => updateFilter('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.slug}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Collection Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Collection</label>
                  <Select value={filters.collection || ''} onValueChange={(value) => updateFilter('collection', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All collections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All collections</SelectItem>
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.slug}>
                          {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Content Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content Type</label>
                  <Select value={filters.content_type || ''} onValueChange={(value) => updateFilter('content_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="movie">Movies</SelectItem>
                      <SelectItem value="series">Series</SelectItem>
                      <SelectItem value="documentary">Documentaries</SelectItem>
                      <SelectItem value="short">Shorts</SelectItem>
                      <SelectItem value="trailer">Trailers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Year Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <Input
                    type="number"
                    placeholder="e.g., 2024"
                    value={filters.year || ''}
                    onChange={(e) => updateFilter('year', parseInt(e.target.value) || undefined)}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Search Button */}
          <Button onClick={handleSearch} size="sm">
            Search
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {categories.find(c => c.slug === filters.category)?.name}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('category')}
              />
            </Badge>
          )}
          {filters.collection && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Collection: {collections.find(c => c.slug === filters.collection)?.name}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('collection')}
              />
            </Badge>
          )}
          {filters.content_type && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Type: {filters.content_type}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('content_type')}
              />
            </Badge>
          )}
          {filters.year && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Year: {filters.year}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('year')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;