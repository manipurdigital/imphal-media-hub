import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Navigation = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Add error boundary for auth context
  let user = null;
  let profile = null;
  let signOut = async () => ({ error: null });
  
  try {
    const auth = useAuth();
    user = auth.user;
    profile = auth.profile;
    signOut = auth.signOut;
  } catch (error) {
    console.log('AuthProvider not available, showing unauthenticated state');
  }
  
  const { data: userRole } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
      navigate('/auth');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-gradient border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-gradient glow-effect hover:glow-effect-strong transition-all duration-300 interactive-scale">
              KANGLEIPAK
            </Link>
            
            {/* Navigation Links - Only show if authenticated */}
            {user && (
              <div className="hidden md:flex space-x-6">
                <Link to="/" className="text-foreground hover:text-primary transition-all duration-300 interactive-scale hover:text-glow">Home</Link>
                <a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 interactive-scale hover:text-glow">Movies</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 interactive-scale hover:text-glow">TV Shows</a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 interactive-scale hover:text-glow">My List</a>
              </div>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Search - Only show if authenticated */}
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search movies, shows..."
                    className="pl-10 pr-4 py-2 glass-morphism rounded-lg transition-all duration-300
                             focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                             focus:glow-effect placeholder:text-muted-foreground text-sm w-64
                             hover:bg-white/10"
                  />
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary interactive-scale">
                  <Bell className="w-5 h-5" />
                </Button>

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {profile?.full_name ? getInitials(profile.full_name) : (
                            user.email ? getInitials(user.email) : 'U'
                          )}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.full_name || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Account Settings</span>
                    </DropdownMenuItem>
                    {userRole === 'admin' && (
                      <DropdownMenuItem>
                        <Link to="/admin" className="flex items-center w-full">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <span>Help Center</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              /* Show sign in button for unauthenticated users */
              <Link to="/auth">
                <Button variant="outline">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;