import { init, miniApp, retrieveLaunchParams, viewport } from '@tma.js/sdk';
import { useEffect } from 'react';
import './main.scss';

export const Static = () => {
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
