import { FC, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/store/hook";
import { tick, updateTimer } from "../../entities/game/model/timerSlice";

type GameProcessProps = {
  /** 
   * Маршрут для перехода на страницу
  */
  route?: string;
}

/** 
 * Процесс игры, переходы между экранами
*/
export const GameProcess: FC<GameProcessProps> = ({ route }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { tickSeconds, isRunning } = useAppSelector(
    (state) => state.timer
  );

  // тик
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      dispatch(tick());
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, dispatch]);

  // переход
  useEffect(() => {
    if (tickSeconds === 0 && route) {
      dispatch(updateTimer());
      navigate(route);
    }
  }, [tickSeconds, route, navigate]);

  return (
    <></>
  )
}