import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import ContentCarousel from '@/components/ContentCarousel';

// Import movie images
import movie1 from '@/assets/movie-1.jpg';
import movie2 from '@/assets/movie-2.jpg';
import movie3 from '@/assets/movie-3.jpg';
import movie4 from '@/assets/movie-4.jpg';
import movie5 from '@/assets/movie-5.jpg';

const Index = () => {
  // Sample content data
  const trendingContent = [
    {
      id: '1',
      title: 'Cyber Nexus',
      image: movie1,
      rating: 8.7,
      year: 2024,
      genre: 'Sci-Fi',
      duration: '2h 15m',
      description: 'A thrilling journey through a dystopian future where technology and humanity collide.'
    },
    {
      id: '2',
      title: 'Mystic Realm',
      image: movie2,
      rating: 9.1,
      year: 2024,
      genre: 'Fantasy',
      duration: '2h 42m',
      description: 'An epic fantasy adventure through magical realms filled with wonder and danger.'
    },
    {
      id: '3',
      title: 'Endless Love',
      image: movie3,
      rating: 8.2,
      year: 2024,
      genre: 'Romance',
      duration: '1h 58m',
      description: 'A heartwarming love story that transcends time and challenges.'
    },
    {
      id: '4',
      title: 'Speed Fury',
      image: movie4,
      rating: 8.9,
      year: 2024,
      genre: 'Action',
      duration: '2h 8m',
      description: 'High-octane action with breathtaking chase sequences and explosive stunts.'
    },
    {
      id: '5',
      title: 'Dark Manor',
      image: movie5,
      rating: 8.4,
      year: 2024,
      genre: 'Horror',
      duration: '1h 47m',
      description: 'A spine-chilling horror experience that will keep you on the edge of your seat.'
    }
  ];

  const popularContent = [
    {
      id: '6',
      title: 'Quantum Leap',
      image: movie1,
      rating: 8.8,
      year: 2023,
      genre: 'Sci-Fi',
      duration: '2h 22m',
      description: 'Time-traveling adventure with mind-bending plot twists.'
    },
    {
      id: '7',
      title: 'Dragon\'s Quest',
      image: movie2,
      rating: 9.0,
      year: 2023,
      genre: 'Fantasy',
      duration: '2h 35m',
      description: 'Epic tale of heroes and dragons in a magical world.'
    },
    {
      id: '8',
      title: 'Heart of Gold',
      image: movie3,
      rating: 8.3,
      year: 2023,
      genre: 'Romance',
      duration: '2h 1m',
      description: 'A touching romance that explores the depths of human connection.'
    },
    {
      id: '9',
      title: 'Thunder Strike',
      image: movie4,
      rating: 8.6,
      year: 2023,
      genre: 'Action',
      duration: '1h 54m',
      description: 'Intense action thriller with spectacular fight sequences.'
    },
    {
      id: '10',
      title: 'Haunted Dreams',
      image: movie5,
      rating: 8.1,
      year: 2023,
      genre: 'Horror',
      duration: '1h 39m',
      description: 'Psychological horror that blurs the line between dreams and reality.'
    }
  ];

  const newReleases = [
    {
      id: '11',
      title: 'Stellar Odyssey',
      image: movie1,
      rating: 8.5,
      year: 2024,
      genre: 'Sci-Fi',
      duration: '2h 18m',
      description: 'A space exploration epic that pushes the boundaries of imagination.'
    },
    {
      id: '12',
      title: 'Enchanted Forest',
      image: movie2,
      rating: 8.9,
      year: 2024,
      genre: 'Fantasy',
      duration: '2h 11m',
      description: 'Magical creatures and ancient secrets await in this enchanting tale.'
    },
    {
      id: '13',
      title: 'First Love',
      image: movie3,
      rating: 8.0,
      year: 2024,
      genre: 'Romance',
      duration: '1h 52m',
      description: 'A beautiful story of young love and the challenges of growing up.'
    },
    {
      id: '14',
      title: 'Maximum Impact',
      image: movie4,
      rating: 8.7,
      year: 2024,
      genre: 'Action',
      duration: '2h 3m',
      description: 'Non-stop action with incredible practical effects and stunts.'
    },
    {
      id: '15',
      title: 'Nightmare Valley',
      image: movie5,
      rating: 8.3,
      year: 2024,
      genre: 'Horror',
      duration: '1h 44m',
      description: 'A terrifying journey into a valley where nightmares come to life.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <HeroSection />

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <ContentCarousel title="Trending Now" items={trendingContent} />
        <ContentCarousel title="Popular on KANGLEIPAK" items={popularContent} />
        <ContentCarousel title="New Releases" items={newReleases} />
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">KANGLEIPAK</h3>
              <p className="text-muted-foreground text-sm">
                Your premier destination for entertainment. Stream thousands of movies and shows.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Home</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Movies</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">TV Shows</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">My List</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 KANGLEIPAK OTT Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
