import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import ContentCard from './ContentCard';

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
}

const ContentCarousel = ({ title, items }: ContentCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-shadow animate-slide-up">{title}</h2>
        
        {/* Navigation Arrows */}
        <div className="hidden md:flex items-center space-x-2">
          <button
            onClick={() => scroll('left')}
            className="glass-morphism rounded-full p-2 transition-all duration-300 interactive-scale hover:glow-effect"
          >
            <ChevronLeft className="w-5 h-5 text-secondary-foreground" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="glass-morphism rounded-full p-2 transition-all duration-300 interactive-scale hover:glow-effect"
          >
            <ChevronRight className="w-5 h-5 text-secondary-foreground" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="carousel-scroll"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, index) => (
          <div key={item.id} className="animate-slide-left" style={{ animationDelay: `${index * 0.1}s` }}>
            <ContentCard {...item} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ContentCarousel;