import { useEffect } from 'react';
import './main.scss'

export const Static = () => {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
  
    tg.ready();
    tg.expand();
  
    const updateInset = () => {
      const inset =
        tg.safeAreaInset?.top ?? 0;
  
      const extra =
        tg.platform !== 'tdesktop' ? 60 : 0;
  
      document.documentElement.style.setProperty(
        '--tg-top-inset',
        `${inset + extra}px`
      );
    };
  
    updateInset();
    tg.onEvent('viewportChanged', updateInset);
  
    return () => {
      tg.offEvent('viewportChanged', updateInset);
    };
  }, []);
  return (
    <></>
  )
}