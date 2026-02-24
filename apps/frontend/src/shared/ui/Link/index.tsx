import clsx from 'clsx';
import { type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaySound } from '../../lib/sound/usePlaySound';
import styles from './style/linkStyle.module.scss';

type LinkProps = {
  /**
   * Иконка сыслки
   */
  icon: any;
  /**
   * Путь, для перехода на страницу
   */
  route: string;
  className?: string;
};

/**
 * Ссылка для перехода страниц
 */
export const Link: FC<LinkProps> = ({ icon, route, className }) => {
  const navigate = useNavigate();
  const playSound = usePlaySound();

  const onLink = () => {
    playSound();
    navigate(route);
  };

  return (
    <button className={clsx(styles.link, className)} onClick={onLink}>
      <img src={icon} alt="" />
    </button>
  );
};
