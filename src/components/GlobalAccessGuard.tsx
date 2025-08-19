import React, { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

interface GlobalAccessGuardProps {
  children: React.ReactNode;
}

const GlobalAccessGuard: React.FC<GlobalAccessGuardProps> = ({ children }) => {
  const { user } = useAuth();
  const { isSubscribed, checkSubscription } = useSubscriptionStatus();
  const navigate = useNavigate();
  const location = useLocation();

  // Check access permissions and redirect if needed
  const checkAccess = useCallback(async (targetPath?: string, isPPVContent?: boolean) => {
    const currentPath = targetPath || location.pathname;
    
    // 1. PPV/Premium Content - Always redirect to payment (overrides all other logic)
    if (isPPVContent) {
      navigate('/payment');
      return false;
    }

    // 2. Non-authenticated users on home page
    if (!user && currentPath === '/') {
      navigate('/auth?tab=signin');
      return false;
    }

    // 3. Allow access to auth pages for non-authenticated users
    if (!user && (currentPath.startsWith('/auth') || currentPath === '/verify-email')) {
      return true;
    }

    // 4. Non-authenticated users trying to access other pages
    if (!user) {
      navigate('/auth?tab=signin');
      return false;
    }

    // 5. Authenticated users - check subscription for most pages
    if (user) {
      // Allow access to profile, auth, and sign out functionality
      const allowedPaths = ['/profile', '/auth', '/verify-email', '/subscribe', '/payment'];
      if (allowedPaths.some(path => currentPath.startsWith(path))) {
        return true;
      }

      // Check subscription status
      const hasSubscription = await checkSubscription();
      
      if (!hasSubscription) {
        navigate('/subscribe');
        return false;
      }
    }

    return true;
  }, [user, navigate, location.pathname, checkSubscription]);

  // Handle route-based access control (direct URL access)
  useEffect(() => {
    checkAccess();
  }, [checkAccess, location.pathname]);

  // Global event handler for click interactions
  useEffect(() => {
    const handleGlobalClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if it's a PPV/Premium content element
      const isPPVElement = target.closest('[data-content-type="ppv"]') || 
                          target.closest('[data-content-type="premium"]') ||
                          target.closest('.ppv-content') ||
                          target.closest('.premium-content');

      // Get target path from link elements
      let targetPath = location.pathname;
      const linkElement = target.closest('a[href]') as HTMLAnchorElement;
      if (linkElement) {
        targetPath = linkElement.getAttribute('href') || location.pathname;
      }

      // Check access and prevent default if needed
      const hasAccess = await checkAccess(targetPath, !!isPPVElement);
      
      if (!hasAccess) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    const handleGlobalKeyDown = async (event: KeyboardEvent) => {
      // Only handle interaction keys
      if (!['Enter', ' '].includes(event.key)) return;

      const target = event.target as HTMLElement;
      
      // Check if it's a PPV/Premium content element
      const isPPVElement = target.closest('[data-content-type="ppv"]') || 
                          target.closest('[data-content-type="premium"]');

      // Check access for keyboard interactions
      const hasAccess = await checkAccess(location.pathname, !!isPPVElement);
      
      if (!hasAccess) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    // Add event listeners in capture phase for maximum control
    document.addEventListener('click', handleGlobalClick, true);
    document.addEventListener('keydown', handleGlobalKeyDown, true);

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      document.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [checkAccess, location.pathname]);

  // Render content with visual overlay for restricted users
  if (!user && location.pathname === '/') {
    return (
      <div className="relative group">
        {children}
        {/* Invisible overlay for non-authenticated users on home page */}
        <div 
          className="absolute inset-0 z-50 cursor-pointer bg-transparent"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate('/auth?tab=signin');
          }}
          role="button"
          aria-label="Sign in to access content"
          style={{ pointerEvents: 'all' }}
        />
        <div className="absolute top-4 right-4 z-50 bg-black/90 text-white px-4 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none backdrop-blur-sm">
          👋 Sign in to start watching
        </div>
      </div>
    );
  }

  if (user && !isSubscribed && !['/profile', '/auth', '/subscribe', '/payment'].some(path => location.pathname.startsWith(path))) {
    return (
      <div className="relative group">
        {children}
        {/* Overlay for authenticated users without subscription */}
        <div 
          className="absolute inset-0 z-50 cursor-pointer bg-transparent"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate('/subscribe');
          }}
          role="button"
          aria-label="Subscribe to access content"
          style={{ pointerEvents: 'all' }}
        />
        <div className="absolute top-4 right-4 z-50 bg-primary/90 text-white px-4 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none backdrop-blur-sm">
          🔐 Subscribe to unlock content
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default GlobalAccessGuard;