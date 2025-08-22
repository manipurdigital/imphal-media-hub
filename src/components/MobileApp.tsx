import { useEffect } from 'react';
import { useMobile } from '@/hooks/useMobile';
import { useStatusBar } from '@/hooks/useStatusBar';
import { useBackButton } from '@/hooks/useBackButton';
import { useSafeArea } from '@/hooks/useSafeArea';
import { cn } from '@/lib/utils';

interface MobileAppProps {
  children: React.ReactNode;
}

const MobileApp = ({ children }: MobileAppProps) => {
  const { isNative, isMobile } = useMobile();
  const safeAreaInsets = useSafeArea();
  
  // Initialize mobile-specific features
  useStatusBar();
  useBackButton();

  useEffect(() => {
    if (isNative) {
      // Prevent zoom on iOS
      document.addEventListener('gesturestart', (e) => e.preventDefault());
      document.addEventListener('gesturechange', (e) => e.preventDefault());
      document.addEventListener('gestureend', (e) => e.preventDefault());
      
      // Prevent double-tap zoom
      let lastTouchEnd = 0;
      document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }, false);
    }
  }, [isNative]);

  const containerStyle = isNative ? {
    paddingTop: `${safeAreaInsets.top}px`,
    paddingBottom: `${safeAreaInsets.bottom}px`,
    paddingLeft: `${safeAreaInsets.left}px`,
    paddingRight: `${safeAreaInsets.right}px`,
  } : {};

  return (
    <div 
      className={cn(
        'min-h-screen bg-background',
        isNative && 'mobile-safe-area',
        isMobile && 'mobile-touch-optimized'
      )}
      style={containerStyle}
    >
      {children}
    </div>
  );
};

export default MobileApp;