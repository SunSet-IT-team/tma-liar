import { useEffect } from 'react';
import bgMusic from '../../../shared/assets/sounds/tipa_for_lobby_u_know.mp3';
import { useAppSelector } from '../../store/hook';
import { getSound, stopCachedSound } from '../../../shared/lib/sound/sound-pool';

/** 
 * Звуковые настройки игры
*/
export const useBackgroundMusic = () => {
  const { backgroundMusic, volume } = useAppSelector(
    (state) => state.appSettings
  );

  useEffect(() => {
    const audio = getSound(bgMusic);
    audio.loop = true;
    audio.volume = volume / 100;

    // Если музыка выключена или громкость 0 — полностью останавливаем
    if (!backgroundMusic || volume === 0) {
      stopCachedSound(bgMusic);
      return;
    }

    audio.play().catch(() => undefined);
  }, [backgroundMusic, volume]);
};
