import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMobile } from './useMobile';

export const useBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isNative, isAndroid } = useMobile();

  useEffect(() => {
    if (!isNative || !isAndroid) return;

    const handleBackButton = () => {
      // Allow back navigation if not on root page
      if (location.pathname !== '/') {
        navigate(-1);
        return;
      }

      // If on root page, minimize app
      App.minimizeApp();
    };

    let backButtonListener: any;

    App.addListener('backButton', handleBackButton).then(listener => {
      backButtonListener = listener;
    });

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [navigate, location.pathname, isNative, isAndroid]);
};