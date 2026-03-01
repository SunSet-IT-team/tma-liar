import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { PageRoutes } from '@app/routes/pages';
import tickSound from '@shared/assets/sounds/taymer-konec-aukciona__mp3cut.net_.mp3';

type UseTickSoundParams = {
  tickSeconds: number | null;
  isFixed?: boolean;
};

export function useTickSound({ tickSeconds, isFixed }: UseTickSoundParams) {
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  const playTickSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(tickSound);
      audioRef.current.loop = true;
      audioRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (isFixed) {
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

    if (isChoosingLiar) {
      if (tickSeconds <= 5) {
        playTickSound();
      } else {
        stopSound();
      }
      return;
    }

    if (tickSeconds <= 11) {
      playTickSound();
    } else {
      stopSound();
    }
  }, [isFixed, location.pathname, tickSeconds]);

  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);
}

