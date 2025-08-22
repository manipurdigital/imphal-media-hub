import { useEffect, useState } from 'react';
import { useMobile } from './useMobile';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const useSafeArea = () => {
  const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });
  const { isNative } = useMobile();

  useEffect(() => {
    const getSafeAreaInsets = async () => {
      if (!isNative) return;

      // For now, use default safe area values
      // Will be updated when @capacitor/safe-area plugin is available
      setSafeAreaInsets({
        top: 44, // Default iOS notch height
        bottom: 34, // Default iOS home indicator height
        left: 0,
        right: 0
      });
    };

    getSafeAreaInsets();
  }, [isNative]);

  return safeAreaInsets;
};