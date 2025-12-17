import { useEffect, useRef } from 'react';
import bgMusic from '../../../shared/assets/sounds/tipa_for_lobby_u_know.mp3';
import { useAppSelector } from '../../store/hook';

/** 
 * Звуковые настройки игры
*/
export const useBackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { backgroundMusic, volume } = useAppSelector(
    (state) => state.appSettings
  );

  useEffect(() => {
    // Если музыка выключена или громкость 0 — полностью останавливаем
    if (!backgroundMusic || volume === 0) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = ''; // освобождаем ресурсы
        audioRef.current = null;
      }
      return;
    }

    // Если нужно включить музыку
    if (!audioRef.current) {
      const audio = new Audio(bgMusic);
      audio.loop = true;
      audio.volume = volume / 100;
      audio.play().catch(() => {
        // браузер может заблокировать autoplay
      });

      audioRef.current = audio;
    } else {
      // Просто меняем громкость
      audioRef.current.volume = volume / 100;
    }
  }, [backgroundMusic, volume]);
};
