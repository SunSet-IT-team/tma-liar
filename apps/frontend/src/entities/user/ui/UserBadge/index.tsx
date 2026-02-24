import { type FC } from 'react';
import styles from '../../style/userStyle.module.scss';
import noPhoto from '../../../../../public/icons/blackPhoto.svg';
import { Typography } from '../../../../shared/ui/Typography';
import clsx from 'clsx';
import hornsIcon from '../../../../../public/icons/hornsIcon.svg';
import type { Player } from '../../model/types';

type UserBadgeProps = Player & {
  className?: string;
};

/**
 * Отображение блока с игроком (фото, имя)
 * Используется в компоненте показа подключившихся игроков
 */
export const UserBadge: FC<UserBadgeProps> = ({
  photo,
  name,
  variant = 'default',
  isLiar,
  currentPlayer,
  className,
}) => {
  return (
    <div className={clsx(styles.content, styles[variant], className)}>
      <div className={styles.userPhotoBlock}>
        <img
          src={photo ? photo : noPhoto}
          alt=""
          className={clsx(styles.userPhoto, currentPlayer && styles.userPhotoOutline)}
        />
        {isLiar && <img src={hornsIcon} alt="" className={styles.hornsImg} />}
      </div>
      <Typography
        variant="caption"
        className={clsx(styles.username, currentPlayer && styles.currentUser)}
      >
        {name}
      </Typography>
    </div>
  );
};
