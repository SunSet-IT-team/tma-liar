import { type CSSProperties, type FC, useEffect, useState } from 'react';
import styles from './style/taimerStyle.module.scss';
import timerCircle from '/icons/taimerCircle.svg';
import { useAppSelector } from '../../../app/store/hook';

/**
 * Полукруг таймера: плавно сужается слева направо (clip-path), остаток от якоря startTimer.
 */
export const Timer: FC = () => {
  const time = useAppSelector((state) => state.timer.time);
  const tickSeconds = useAppSelector((state) => state.timer.tickSeconds);
  const anchorWallTimeMs = useAppSelector((state) => state.timer.anchorWallTimeMs);
  const isRunning = useAppSelector((state) => state.timer.isRunning);

  const [, setFrame] = useState(0);

  useEffect(() => {
    if (!isRunning || time <= 0 || anchorWallTimeMs === null) {
      return;
    }
    let id = 0;
    const loop = () => {
      setFrame((x) => x + 1);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [isRunning, time, anchorWallTimeMs]);

  let ratio = 1;
  if (time > 0 && anchorWallTimeMs !== null) {
    const elapsedSec = (Date.now() - anchorWallTimeMs) / 1000;
    const remainingSec = Math.max(0, time - elapsedSec);
    ratio = Math.min(1, remainingSec / time);
  } else if (time > 0 && tickSeconds !== null) {
    ratio = Math.min(1, Math.max(0, tickSeconds / time));
  }

  const leftInsetPercent = (1 - ratio) * 100;
  const clipPath = `inset(0 0 0 ${leftInsetPercent}%)`;
  const clipStyle: CSSProperties = {
    clipPath,
    WebkitClipPath: clipPath,
  };

  return (
    <>
      <div className={styles.spacer} aria-hidden data-decor="true" />
      <div className={styles.content} data-decor="true">
        <div className={styles.timerFigure}>
          <img
            src={timerCircle}
            alt=""
            className={styles.taimerIcon}
            style={clipStyle}
            aria-hidden
          />
        </div>
      </div>
    </>
  );
};
