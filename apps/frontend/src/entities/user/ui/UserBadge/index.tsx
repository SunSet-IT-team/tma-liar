import { FC } from "react"
import styles from '../../style/userStyle.module.scss'
import noPhoto from '../../../../../public/icons/blackPhoto.svg'
import { Typography } from "../../../../shared/ui/Typography";
import clsx from "clsx";
import hornsIcon from '../../../../../public/icons/hornsIcon.svg'

export type UserVariant = | 'large' | 'medium' | 'default'

export type UserProps = {
  id: number;
  /**
    * Фото игрока
  */
  photo?: string;
  /**
    * Никнейм игрока
  */
  name: string;
  /**
    * Лжец ли игрок
  */
  isLzhets: boolean;
  /**
    * Текущий игрок (ты)
  */
  isYou: boolean;
  /**
    * Варианты размеров блока с игроком
  */
  variant?: UserVariant;
  className?: string;
}

/** 
 * Отображение блока с игроком (фото, имя)
 * Используется в компоненте показа подключившихся игроков
*/
export const UserBadge: FC<UserProps> = ({ photo, name, variant = 'default', isLzhets, isYou, className }) => {
  return (
    <div className={clsx(styles.content, styles[variant], className)}>
      <div className={styles.userPhotoBlock}>
        <img src={photo ? photo : noPhoto} alt="" className={clsx(styles.userPhoto, isYou && styles.userPhotoOutline)} />
        {isLzhets && 
          <img src={hornsIcon} alt="" className={styles.hornsImg} />
        }
      </div>
      <Typography variant="caption" className={styles.username}>{name}</Typography>
    </div>
  )
}