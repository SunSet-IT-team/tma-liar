import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { PageRoutes } from '@app/routes/pages';
import tickSound from '@shared/assets/sounds/taymer-konec-aukciona__mp3cut.net_.mp3';
import { useAppSelector } from '@app/store/hook';
import { getSound, stopCachedSound } from '@shared/lib/sound/sound-pool';

type UseTickSoundParams = {
  tickSeconds: number | null;
  isFixed?: boolean;
};

export function useTickSound({ tickSeconds, isFixed }: UseTickSoundParams) {
  const location = useLocation();
  const { sounds, volume } = useAppSelector((state) => state.appSettings);
  const startedRef = useRef(false);

  const stopSound = () => {
    startedRef.current = false;
    stopCachedSound(tickSound);
  };

  const playTickSound = () => {
    const audio = getSound(tickSound);
    audio.loop = true;
    audio.volume = volume / 100;
    startedRef.current = true;
    if (audio.paused) {
      audio.play().catch(() => undefined);
    }
  };

  useEffect(() => {
    if (isFixed) {
      stopSound();
      return;
    }

    if (!sounds || volume === 0) {
      stopSound();
      return;
    }

    if (!tickSeconds || tickSeconds <= 0) {
      stopSound();
      return;
    }

    const isResultsRoute =
      location.pathname === `/${PageRoutes.RESULT_GAME}` || location.pathname === `/${PageRoutes.END_GAME}`;
    if (isResultsRoute) {
      stopSound();
      return;
    }

    const isChoosingLiar = location.pathname === `/${PageRoutes.CHOOSING_LIAR}`;
    const startThreshold = isChoosingLiar ? 5 : 11;
    const shouldStartNow = tickSeconds <= startThreshold;

    // Если звук уже стартовал в текущем этапе, не останавливаем его
    // до явного завершения этапа (tickSeconds <= 0 / fixed / смена экрана).
    if (startedRef.current || shouldStartNow) {
      playTickSound();
    }
  }, [isFixed, location.pathname, sounds, tickSeconds, volume]);

  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);
}
