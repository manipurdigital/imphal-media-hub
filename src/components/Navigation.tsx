import { useState } from 'react';
import { Search, Bell, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <div className="text-2xl font-bold text-primary glow-effect">
              KANGLEIPAK
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex space-x-6">
              <a href="#" className="text-foreground hover:text-primary transition-colors">Home</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Movies</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">TV Shows</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">My List</a>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search movies, shows..."
                className="pl-10 pr-4 py-2 bg-input/50 border border-border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                         placeholder:text-muted-foreground text-sm w-64"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Bell className="w-5 h-5" />
            </Button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-[var(--card-shadow)] py-2 z-50">
                  <a href="#" className="block px-4 py-2 text-sm text-foreground hover:bg-secondary/50">
                    Manage Profiles
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-foreground hover:bg-secondary/50">
                    Account Settings
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-foreground hover:bg-secondary/50">
                    Help Center
                  </a>
                  <hr className="my-2 border-border" />
                  <a href="#" className="block px-4 py-2 text-sm text-foreground hover:bg-secondary/50">
                    Sign Out
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;