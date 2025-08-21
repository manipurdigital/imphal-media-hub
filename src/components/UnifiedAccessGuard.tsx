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
    // Remove all automatic route redirects - let users browse freely
    // Only PPV content will be gated via click handlers
  }, []);

  // Handle route-based access control on navigation - DISABLED for free browsing
  useEffect(() => {
    // checkRouteAccess(); // Commented out to allow free browsing
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

      // Remove all other automatic redirects - only PPV content is gated
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
  }, [user, isSubscribed, location.pathname, navigate, loading]);

  // Visual overlay for restricted access - DISABLED for free browsing
  const shouldShowOverlay = () => {
    // No overlays - let users browse freely, only PPV content is gated
    return { show: false };
  };

  const overlay = shouldShowOverlay();

  // Since overlay.show is always false, this code will never execute
  // Keeping minimal structure for future use if needed
  return <>{children}</>;
};

export default UnifiedAccessGuard;