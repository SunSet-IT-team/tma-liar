import { type FC, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../app/routes/pages';
import { useAppDispatch, useAppSelector } from '../../app/store/hook';
import { tick, updateTimer } from '../../entities/game/model/timerSlice';
import tickSound from '../../shared/assets/sounds/taymer-konec-aukciona__mp3cut.net_.mp3';

type GameProcessProps = {
  /**
   * Маршрут для перехода на страницу
   */
  route?: string;
  /**
   * Зафиксирован ли ответ
   */
  isFixed?: boolean;
};

/**
 * Процесс игры, переходы между экранами
 */
export const GameProcess: FC<GameProcessProps> = ({ route, isFixed }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { tickSeconds, isRunning } = useAppSelector((state) => state.timer);

  /** ref для аудио */
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // тик
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      dispatch(tick());
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, dispatch]);

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

    const isChoosingLiar = location.pathname === `/${PageRoutes.CHOOSING_LIAR}`;

    // ChoosingLiar — только последние 5 сек
    if (isChoosingLiar) {
      if (tickSeconds <= 5) {
        playTickSound();
      } else {
        stopSound();
      }
      return;
    }

    // все остальные экраны — последние 11 сек
    if (tickSeconds <= 11) {
      playTickSound();
    } else {
      stopSound();
    }
  }, [tickSeconds, location.pathname]);

  // переход
  useEffect(() => {
    if (tickSeconds === 0 && route) {
      stopSound();
      dispatch(updateTimer());
      navigate(route);
    }
  }, [tickSeconds, route, navigate]);

  /** очистка при размонтировании */
  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  return <></>;
};
