import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ClickGuardProps {
  children: React.ReactNode;
  enabled?: boolean;
  redirectPath?: string;
}

const ClickGuard: React.FC<ClickGuardProps> = ({ 
  children, 
  enabled = true, 
  redirectPath = '/auth?tab=signin' 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!enabled || user) return;

    const handleClick = (event: MouseEvent) => {
      // Stop all click events for non-authenticated users
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      // Redirect to auth page
      navigate(redirectPath);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Block interaction keys for non-authenticated users
      if (['Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Only redirect on Enter and Space (interaction keys)
        if (['Enter', ' '].includes(event.key)) {
          navigate(redirectPath);
        }
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!user) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (!user) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    // Add event listeners to capture all interactions
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('touchstart', handleTouchStart, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('touchstart', handleTouchStart, true);
    };
  }, [user, enabled, navigate, redirectPath]);

  // Add visual overlay for non-authenticated users
  if (enabled && !user) {
    return (
      <div className="relative group">
        {children}
        {/* Invisible overlay that captures all interactions */}
        <div 
          className="absolute inset-0 z-50 cursor-pointer bg-transparent"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(redirectPath);
          }}
          onKeyDown={(e) => {
            if (['Enter', ' '].includes(e.key)) {
              e.preventDefault();
              e.stopPropagation();
              navigate(redirectPath);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Sign in to access content"
          style={{ pointerEvents: 'all' }}
        />
        {/* Subtle hover hint */}
        <div className="absolute top-4 right-4 z-50 bg-black/90 text-white px-4 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none backdrop-blur-sm">
          👋 Sign in to start watching
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ClickGuard;