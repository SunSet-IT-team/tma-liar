import { useAppSelector } from '../../../app/store/hook';
import soundClick from '../../assets/sounds/iron-off-button.mp3';
import { playCachedSound } from './sound-pool';
import { playWebAudio, preloadWebAudio } from './web-audio';

let isClickPreloaded = false;
const LAST_PLAY_AT_BY_SRC = new Map<string, number>();
const DUPLICATE_GUARD_MS = 24;

/** 
 * Звук при нажатии на кнопки
*/
export const usePlaySound = () => {
  const { volume, sounds } = useAppSelector(
    (state) => state.appSettings
  );

  if (!isClickPreloaded) {
    isClickPreloaded = true;
    void preloadWebAudio(soundClick);
  }

  return (src: string = soundClick) => {
    if (!sounds) return;
    const normalizedVolume = volume / 100;
    const now = performance.now();
    const lastPlayedAt = LAST_PLAY_AT_BY_SRC.get(src) ?? 0;
    if (now - lastPlayedAt < DUPLICATE_GUARD_MS) return;
    LAST_PLAY_AT_BY_SRC.set(src, now);

    const playedByWebAudio = playWebAudio(src, normalizedVolume);
    if (playedByWebAudio) return;

    // Fallback для окружений без Web Audio.
    playCachedSound(src, normalizedVolume, false);
  };
};
