import { init, miniApp, retrieveLaunchParams, viewport } from '@tma.js/sdk';
import { useEffect } from 'react';
import './main.scss';
import { preloadSounds } from '../../shared/lib/sound/preload-sounds';

export const Static = () => {
  useEffect(() => {
    preloadSounds();
  }, []);

  useEffect(() => {
    const preventZoomGesture = (event: Event) => {
      event.preventDefault();
    };

    const preventTrackpadZoom = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    };

    document.addEventListener('gesturestart', preventZoomGesture, { passive: false });
    document.addEventListener('gesturechange', preventZoomGesture, { passive: false });
    document.addEventListener('gestureend', preventZoomGesture, { passive: false });
    document.addEventListener('wheel', preventTrackpadZoom, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', preventZoomGesture);
      document.removeEventListener('gesturechange', preventZoomGesture);
      document.removeEventListener('gestureend', preventZoomGesture);
      document.removeEventListener('wheel', preventTrackpadZoom);
    };
  }, []);

  useEffect(() => {
    let cleanupSdk: VoidFunction | null = null;
    let removeSafeAreaListener: VoidFunction | null = null;

    try {
      cleanupSdk = init();
      miniApp.ready();
      viewport.mount();
      viewport.expand();
    } catch {
      return;
    }

    let platform = 'unknown';
    try {
      platform = retrieveLaunchParams().tgWebAppPlatform;
    } catch {
      platform = 'unknown';
    }

    const updateInset = () => {
      const inset = viewport.safeAreaInsetTop();
      const extra = platform !== 'tdesktop' ? 60 : 0;

      document.documentElement.style.setProperty(
        '--tg-top-inset',
        `${(inset ?? 0) + extra}px`,
      );
    };

    updateInset();
    removeSafeAreaListener = viewport.safeAreaInsetTop.sub(updateInset);

    return () => {
      removeSafeAreaListener?.();
      cleanupSdk?.();
    };
  }, []);

  return (
    <></>
  );
};
