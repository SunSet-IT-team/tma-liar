import { FC } from "react"
import { useAppSelector } from "../../../app/store/hook";
import { Typography } from "../Typography";

type AnswersTimerProps = {
  className?: string;
}

/** 
 * Таймер отсчета времени
*/
export const AnswersTimer: FC<AnswersTimerProps> = ({ className }) => {
  const { tickSeconds } = useAppSelector(
    (state) => state.timer
  );

  return (
    <Typography className={className}>
      {tickSeconds} c
    </Typography>
  )
}