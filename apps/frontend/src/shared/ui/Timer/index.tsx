import { type FC } from 'react';
import styles from './style/taimerStyle.module.scss';
import timerCircle from '/icons/taimerCircle.svg';
import { useAppSelector } from '../../../app/store/hook';

/**
 * Отображение анимации исчезновения картинки с учетом времени (time)
 * Используется на странице выбора вранья лжеца
 */
export const Timer: FC = () => {
  const time = useAppSelector((state) => state.timer.time);

  return (
    <>
      <div className={styles.spacer} aria-hidden data-decor="true" />
      <div className={styles.content} data-decor="true">
        <img src={timerCircle} alt="Timer circle" className={styles.taimerIcon} />
        <div className={styles.loaderWrapper}>
          <div className={styles.loader} style={{ animationDuration: `${time}s` }} />
        </div>
      </div>
    </>
  );
};
