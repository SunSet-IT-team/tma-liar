import { useEffect } from 'react';
import { useAppDispatch } from '@app/store/hook';
import { tick } from '@entities/game/model/timerSlice';

export function useGameTick(isRunning: boolean) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      dispatch(tick());
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatch, isRunning]);
}

