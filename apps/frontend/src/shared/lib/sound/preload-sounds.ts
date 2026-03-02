import clickSound from '../../assets/sounds/iron-off-button.mp3';
import tickSound from '../../assets/sounds/taymer-konec-aukciona__mp3cut.net_.mp3';
import drumSound from '../../assets/sounds/drumroll.mp3';
import bgMusic from '../../assets/sounds/tipa_for_lobby_u_know.mp3';
import { getSound } from './sound-pool';
import { preloadWebAudio } from './web-audio';

const PRELOAD_LIST = [clickSound, tickSound, drumSound, bgMusic];

/**
 * Подготавливает аудио-элементы заранее, чтобы уменьшить задержки
 * при первом воспроизведении звуков.
 */
export function preloadSounds() {
  for (const src of PRELOAD_LIST) {
    const audio = getSound(src);
    audio.load();
  }

  // На мобильных частые клики лучше отдаются через Web Audio.
  void preloadWebAudio(clickSound);
}
