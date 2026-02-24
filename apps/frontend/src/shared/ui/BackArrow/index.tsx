import whiteArrow from '../../../shared/ui/icons/whiteArrow.svg';
import redArrow from '../../../shared/ui/icons/redArrow.svg';
import blackArrow from '../../../shared/ui/icons/blackArrow.svg';
import styles from './style/arrowStyle.module.scss';
import { ButtonHTMLAttributes, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaySound } from '../../lib/sound/usePlaySound';

export type BackArrowVariant = 'white' | 'red' | 'black';

type BackArrowProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * Варианты цветов стрелки (белый, красный, черный)
   */
  variant?: BackArrowVariant;
  onClick?: () => void;
  /**
   * Изменение показа попапа лобби
   */
  leaveLobby?: (value: boolean) => void;
  /**
   * Находится ли в игре игрок
   */
  inGame?: boolean;
};

/**
 * Объект с цветами стрелки
 */
const srcMap: Record<BackArrowVariant, string> = {
  white: whiteArrow,
  red: redArrow,
  black: blackArrow,
};

/**
 * Кнопка назад, будет производить переход на предыдущую страницу
 * Чаще всего используется в шапке (header)
 */
export const BackArrow: FC<BackArrowProps> = ({
  variant = 'black',
  onClick,
  leaveLobby,
  inGame,
  ...rest
}) => {
  const navigate = useNavigate();
  const src = srcMap[variant];
  const playSound = usePlaySound();
  const toLeave = (value: boolean) => {
    playSound();
    if (leaveLobby && inGame) {
      leaveLobby(value);
    } else {
      navigate(-1);
    }
  };

  return (
    <button onClick={() => toLeave(true)} {...rest}>
      <img src={src} className={styles.backArrow} />
    </button>
  );
};
