import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(mobile);
    };

    const checkCapacitor = () => {
      const native = Capacitor.isNativePlatform();
      const currentPlatform = Capacitor.getPlatform() as 'web' | 'ios' | 'android';
      
      setIsNative(native);
      setPlatform(currentPlatform);
    };

    checkMobile();
    checkCapacitor();
  }, []);

  return {
    isMobile,
    isNative,
    platform,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web'
  };
};