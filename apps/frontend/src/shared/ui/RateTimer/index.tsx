import { FC, useEffect, useState } from "react"
import { Typography } from "../Typography";

type RateTimerProps = {
  /** 
   * Время отсчета
  */
  time: number;
  className?: string;
}

/** 
 * Таймер отсчета времени
*/
export const RateTimer: FC<RateTimerProps> = ({ time, className }) => {
  const [seconds, setSeconds] = useState(time);

  useEffect(() => {
    // Если время уже 0 — сразу стоп
    if (seconds <= 0) return;

    const interval = setInterval(() => {
      setSeconds((prev) => Math.max(prev - 1, 0)); // Не уходим в минус
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds]);

  return (
    <Typography className={className}>
      {seconds} c
    </Typography>
  )
}