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
    <section className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
        
        {/* Navigation Arrows */}
        <div className="hidden md:flex items-center space-x-2">
          <button
            onClick={() => scroll('left')}
            className="bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all duration-300 text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all duration-300 text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Netflix-Style Carousel */}
      <div className="netflix-carousel px-4 sm:px-6 lg:px-8">
        <div
          ref={scrollRef}
          className="carousel-scroll"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, index) => (
            <div key={item.id} className="netflix-carousel-item">
              <ContentCard {...item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContentCarousel;