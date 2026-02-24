import { type FC } from 'react';
import styles from './style/taimerStyle.module.scss';
import taimerCircle from '../../../../public/icons/taimerCircle.svg';
import { useAppSelector } from '../../../app/store/hook';

/**
 * Отображение анимации исчезновения картинки с учетом времени (time)
 * Используется на странице выбора вранья лжеца
 */
export const Timer: FC = () => {
  const time = useAppSelector((state) => state.timer.time);

  return (
    <div className={styles.content}>
      <img src={taimerCircle} alt="" className={styles.taimerIcon} />
      <div className={styles.loaderWrapper}>
        <div className={styles.loader} style={{ animationDuration: `${time}s` }} />
      </div>
    </div>
  );
};
