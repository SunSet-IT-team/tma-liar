export {};

/** 
 * Типизация параметров телеграмм
*/
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        platform: string;
        safeAreaInset?: {
          top: number;
          bottom: number;
          left: number;
          right: number;
        };
        onEvent: (
          event: TelegramEvent,
          callback: () => void
        ) => void;

        offEvent: (
          event: TelegramEvent,
          callback: () => void
        ) => void;
      };
    };
  }
}
