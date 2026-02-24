import { useAppSelector } from '../../../app/store/hook';
import soundClick from '../../assets/sounds/iron-off-button.mp3';

let audio: HTMLAudioElement | null = null;

/** 
 * Звук при нажатии на кнопки
*/
export const usePlaySound = () => {
  const { volume, sounds } = useAppSelector(
    (state) => state.appSettings
  );

  return (src: string = soundClick) => {
    if (!sounds) return;

    if (!audio) {
      audio = new Audio(src);
    }

    audio.volume = volume / 100;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };
};
