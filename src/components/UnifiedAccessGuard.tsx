import React, { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

interface UnifiedAccessGuardProps {
  children: React.ReactNode;
}

const UnifiedAccessGuard: React.FC<UnifiedAccessGuardProps> = ({ children }) => {
  const { user } = useAuth();
  const { isSubscribed, checkSubscription, loading } = useSubscriptionStatus();
  const navigate = useNavigate();
  const location = useLocation();

  // Check subscription on mount for authenticated users
  useEffect(() => {
    if (user && isSubscribed === null) {
      checkSubscription();
    }
  }, [user, isSubscribed, checkSubscription]);

  // Define paths that are always accessible
  const publicPaths = ['/auth', '/verify-email'];
  const authenticatedExemptPaths = ['/profile', '/subscribe', '/payment'];

  // Check if current path should redirect based on user state
  const checkRouteAccess = useCallback(async () => {
    const currentPath = location.pathname;

    // 1. Allow public paths for non-authenticated users
    if (!user && publicPaths.some(path => currentPath.startsWith(path))) {
      return;
    }

    // 2. Non-authenticated users - on home page redirect to auth
    if (!user) {
      if (currentPath === '/') {
        navigate('/auth?tab=signin', { replace: true });
      }
      return;
    }

    // 3. Authenticated users - allow exempt paths always
    if (authenticatedExemptPaths.some(path => currentPath.startsWith(path))) {
      return;
    }

    // 4. Authenticated users without subscription - redirect to subscribe
    // Wait for subscription check if still loading
    if (loading) return;
    
    const hasSubscription = isSubscribed !== null ? isSubscribed : await checkSubscription();
    if (!hasSubscription) {
      console.warn('[UnifiedAccessGuard] Route redirect to /subscribe', { path: currentPath, hasSubscription, isSubscribed });
      navigate('/subscribe', { replace: true });
      return;
    }

    // 5. Authenticated users with subscription can access any non-PPV content
  }, [user, location.pathname, navigate, checkSubscription]);

  // Handle route-based access control on navigation
  useEffect(() => {
    checkRouteAccess();
  }, [checkRouteAccess]);

  // Global click handler for all interactions
  useEffect(() => {
    const handleGlobalInteraction = async (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      // Check if this is a PPV/Premium content interaction
      const isPPVElement = target.closest('[data-ppv="true"]') || 
                          target.closest('[data-content-type="ppv"]') ||
                          target.closest('[data-content-type="premium"]') ||
                          target.closest('.ppv-content') ||
                          target.closest('.premium-content');

      if (isPPVElement) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        const contentTitle = target.closest('[data-title]')?.getAttribute('data-title') || 'Premium Content';
        const contentPrice = target.closest('[data-price]')?.getAttribute('data-price') || '99';
        const contentId = target.closest('[data-id]')?.getAttribute('data-id') || '';
        console.info('[UnifiedAccessGuard] PPV redirect to /payment', { contentId, contentTitle, contentPrice });
        navigate(`/payment?contentId=${contentId}&title=${encodeURIComponent(contentTitle)}&price=${contentPrice}`);
        return;
      }

      if (!user && location.pathname === '/') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.info('[UnifiedAccessGuard] Non-auth redirect to /auth?tab=signin from home');
        navigate('/auth?tab=signin');
        return;
      }

      // Rule 2: Authenticated users without subscription (except exempt interactions)
      if (user) {
        // Check if this is an exempt interaction (profile, sign out)
        const isExemptElement = target.closest('[data-exempt="true"]') ||
                               target.closest('.profile-link') ||
                               target.closest('.sign-out-button') ||
                               target.closest('a[href*="/profile"]') ||
                               target.closest('button[data-action="signout"]');

        // Don't check if still loading subscription status
        if (loading) return;
        
        const hasSubscription = isSubscribed !== null ? isSubscribed : await checkSubscription();
        if (!hasSubscription && !isExemptElement && !authenticatedExemptPaths.some(path => location.pathname.startsWith(path))) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          console.warn('[UnifiedAccessGuard] Click redirect to /subscribe', { path: location.pathname, isExemptElement, isSubscribed, hasSubscription });
          navigate('/subscribe');
          return;
        }
      }
    };

    // Add event listeners in capture phase for maximum control
    const events = ['click', 'keydown', 'touchstart', 'pointerdown'];
    
    const handlers = events.map(eventType => {
      const handler = (event: Event) => {
        // For keyboard events, only handle interaction keys
        if (event.type === 'keydown') {
          const keyEvent = event as KeyboardEvent;
          if (!['Enter', ' ', 'Space'].includes(keyEvent.key)) return;
        }
        
        handleGlobalInteraction(event);
      };

      document.addEventListener(eventType, handler, true);
      return { type: eventType, handler };
    });

    return () => {
      handlers.forEach(({ type, handler }) => {
        document.removeEventListener(type, handler, true);
      });
    };
  }, [user, isSubscribed, location.pathname, navigate]);

  // Visual overlay for restricted access
  const shouldShowOverlay = () => {
    const currentPath = location.pathname;
    
    // Show overlay for non-authenticated users on home page
    if (!user && currentPath === '/') {
      return {
        show: true,
        message: '👋 Sign in to start watching',
        onClick: () => navigate('/auth?tab=signin')
      };
    }

    // Show overlay for authenticated users without subscription (except exempt paths)
    if (user && isSubscribed === false && !loading && !authenticatedExemptPaths.some(path => currentPath.startsWith(path))) {
      return {
        show: true,
        message: '🔐 Subscribe to unlock content',
        onClick: () => navigate('/subscribe')
      };
    }

    return { show: false };
  };

  const overlay = shouldShowOverlay();

  if (overlay.show) {
    return (
      <div className="relative group">
        {children}
        {/* Invisible interaction blocker */}
        <div 
          className="absolute inset-0 z-50 cursor-pointer bg-transparent"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            overlay.onClick();
          }}
          onKeyDown={(e) => {
            if (['Enter', ' '].includes(e.key)) {
              e.preventDefault();
              e.stopPropagation();
              overlay.onClick();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Access restricted - click to continue"
          style={{ pointerEvents: 'all' }}
        />
        {/* Hover hint */}
        <div className="absolute top-4 right-4 z-50 bg-black/90 text-white px-4 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none backdrop-blur-sm">
          {overlay.message}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default UnifiedAccessGuard;