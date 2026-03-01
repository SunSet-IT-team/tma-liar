import { type FC } from 'react';
import { useAppSelector } from '@app/store/hook';
import { useGameTick } from './model/useGameTick';
import { useTickSound } from './model/useTickSound';

type GameProcessProps = {
  /**
   * Зафиксирован ли ответ
   */
  isFixed?: boolean;
};

/**
 * Локальный игровой таймер и звуковой тик
 */
export const GameProcess: FC<GameProcessProps> = ({ isFixed }) => {
  const { tickSeconds, isRunning } = useAppSelector((state) => state.timer);
  useGameTick(isRunning);
  useTickSound({ tickSeconds, isFixed });

  return <></>;
};
