import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Menu, LogOut, Bell, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  let user = null;
  let signOut = async () => ({ error: null });
  
  try {
    const auth = useAuth();
    user = auth.user;
    signOut = auth.signOut;
  } catch (error) {
    console.log('AuthProvider not available');
  }

  const { data: userRole } = useUserRole();
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 netflix-nav ${isScrolled ? 'scrolled' : ''} px-16 py-4`}>
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <Link to="/" className="text-red-600 text-2xl font-bold tracking-tight hover:text-red-500 transition-colors">
          IMOINU
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8 ml-12">
          <NavLink to="/" text="Home" />
          <NavLink to="/movies" text="Movies" />
          <NavLink to="/tv-shows" text="TV Shows" />
          <NavLink to="/my-list" text="My List" />
          <NavLink to="/subscription" text="Subscription" />
          <NavLink to="/recommendations" text="For You" />
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-6">

          {user ? (
            <>
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hidden md:flex"
              >
                <Bell className="h-5 w-5" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                    <UserAvatar user={user} size="sm" />
                  </Button>
                </DropdownMenuTrigger>
                 <DropdownMenuContent 
                   align="end" 
                   className="w-56 bg-black/95 border border-white/20 text-white backdrop-blur-md"
                 >
                   <DropdownMenuItem 
                     onClick={() => navigate('/profile')}
                     className="hover:bg-white/10 cursor-pointer focus:bg-white/10"
                   >
                     <User className="mr-2 h-4 w-4" />
                     Account
                   </DropdownMenuItem>
                   {userRole === 'admin' && (
                     <DropdownMenuItem 
                       onClick={() => navigate('/admin')}
                       className="hover:bg-white/10 cursor-pointer focus:bg-white/10"
                     >
                       <Settings className="mr-2 h-4 w-4" />
                       Admin Panel
                     </DropdownMenuItem>
                   )}
                   <DropdownMenuSeparator className="bg-white/20" />
                   <DropdownMenuItem 
                     onClick={handleSignOut}
                     className="hover:bg-white/10 cursor-pointer focus:bg-white/10"
                   >
                     <LogOut className="mr-2 h-4 w-4" />
                      Sign out of Imoinu
                   </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              onClick={() => navigate('/auth')}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2"
            >
              Sign In
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white hover:bg-white/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-80 bg-black/95 border-white/20 text-white backdrop-blur-md"
            >
              <div className="flex flex-col space-y-6 mt-8">
                <MobileNavLink to="/" text="Home" onClick={() => setIsMobileMenuOpen(false)} />
                <MobileNavLink to="/movies" text="Movies" onClick={() => setIsMobileMenuOpen(false)} />
                <MobileNavLink to="/tv-shows" text="TV Shows" onClick={() => setIsMobileMenuOpen(false)} />
                <MobileNavLink to="/my-list" text="My List" onClick={() => setIsMobileMenuOpen(false)} />
                <MobileNavLink to="/subscription" text="Subscription" onClick={() => setIsMobileMenuOpen(false)} />
                <MobileNavLink to="/recommendations" text="For You" onClick={() => setIsMobileMenuOpen(false)} />
                
                 {user && (
                   <>
                     <hr className="border-white/20" />
                     <MobileNavLink to="/profile" text="Account" onClick={() => setIsMobileMenuOpen(false)} />
                     {userRole === 'admin' && (
                       <MobileNavLink to="/admin" text="Admin Panel" onClick={() => setIsMobileMenuOpen(false)} />
                     )}
                     <button
                       onClick={() => {
                         handleSignOut();
                         setIsMobileMenuOpen(false);
                       }}
                       className="text-left text-white hover:text-white/80 transition-colors"
                     >
                       Sign out of Imoinu
                     </button>
                   </>
                 )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

const NavLink: React.FC<{ to: string; text: string }> = ({ to, text }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors duration-200 hover:text-white ${
        isActive ? 'text-white font-semibold' : 'text-white/80'
      }`}
    >
      {text}
    </Link>
  );
};

const MobileNavLink: React.FC<{ to: string; text: string; onClick: () => void }> = ({ 
  to, 
  text, 
  onClick 
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`text-lg font-medium transition-colors duration-200 ${
        isActive ? 'text-white' : 'text-white/80 hover:text-white'
      }`}
    >
      {text}
    </Link>
  );
};

export default Navigation;