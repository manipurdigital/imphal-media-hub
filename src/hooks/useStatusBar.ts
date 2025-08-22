import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useMobile } from './useMobile';

export const useStatusBar = () => {
  const { isNative } = useMobile();

  const setStatusBarStyle = async (style: Style, backgroundColor?: string) => {
    if (!isNative) return;

    try {
      await StatusBar.setStyle({ style });
      if (backgroundColor) {
        await StatusBar.setBackgroundColor({ color: backgroundColor });
      }
    } catch (error) {
      console.warn('StatusBar not available:', error);
    }
  };

  const hideStatusBar = async () => {
    if (!isNative) return;

    try {
      await StatusBar.hide();
    } catch (error) {
      console.warn('StatusBar not available:', error);
    }
  };

  const showStatusBar = async () => {
    if (!isNative) return;

    try {
      await StatusBar.show();
    } catch (error) {
      console.warn('StatusBar not available:', error);
    }
  };

  useEffect(() => {
    // Set dark status bar style for OTT app
    setStatusBarStyle(Style.Dark, '#000000');
  }, [isNative]);

  return {
    setStatusBarStyle,
    hideStatusBar,
    showStatusBar
  };
};