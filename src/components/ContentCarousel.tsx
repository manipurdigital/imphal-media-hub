import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import ContentCard from './ContentCard';
import ContentCardSkeleton from './ContentCardSkeleton';

interface CarouselItem {
  id: string;
  title: string;
  image: string;
  rating: number;
  year: number;
  genre: string;
  duration: string;
  description: string;
}

interface ContentCarouselProps {
  title: string;
  items: CarouselItem[];
  loading?: boolean;
}

const ContentCarousel = ({ title, items, loading = false }: ContentCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScrollButtons);
      return () => scrollElement.removeEventListener('scroll', checkScrollButtons);
    }
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
        
        {/* Enhanced Navigation Arrows */}
        <div className="hidden md:flex items-center space-x-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`glass-morphism hover:bg-white/20 rounded-full p-2 transition-all duration-300 text-white ${
              !canScrollLeft ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`glass-morphism hover:bg-white/20 rounded-full p-2 transition-all duration-300 text-white ${
              !canScrollRight ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Enhanced Netflix-Style Carousel */}
      <div className="netflix-carousel px-4 sm:px-6 lg:px-8">
        <div
          ref={scrollRef}
          className="carousel-scroll"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="netflix-carousel-item">
                <ContentCardSkeleton />
              </div>
            ))
          ) : (
            // Actual content
            items.map((item, index) => (
              <div key={item.id} className="netflix-carousel-item">
                <ContentCard {...item} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default ContentCarousel;