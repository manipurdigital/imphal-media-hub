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
      const scrollAmount = 800;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="mb-16 relative">
      <div className="mb-4 px-16">
        <h2 className="text-2xl font-bold text-white hover:text-white/80 transition-colors cursor-pointer">
          {title}
        </h2>
      </div>
      
      <div className="netflix-carousel" ref={scrollRef}>
        <div className="netflix-carousel-container">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="netflix-carousel-item">
                <ContentCardSkeleton />
              </div>
            ))
          ) : (
            // Actual content
            items.map((item) => (
              <div key={item.id} className="netflix-carousel-item">
                <ContentCard {...item} />
              </div>
            ))
          )}
        </div>
        
        {/* Navigation arrows */}
        {!loading && (
          <>
            <button
              onClick={() => scroll('left')}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-24 bg-black/50 hover:bg-black/80 transition-all flex items-center justify-center ${
                !canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => scroll('right')}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-24 bg-black/50 hover:bg-black/80 transition-all flex items-center justify-center ${
                !canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default ContentCarousel;