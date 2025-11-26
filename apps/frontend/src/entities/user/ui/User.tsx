import { FC } from "react"
import styles from '../style/userStyle.module.scss'
import noPhoto from '../../../assets/icons/blackPhoto.svg'
import { Typography } from "../../../shared/Typography/Typography";
import clsx from "clsx";
import hornsIcon from '../../../assets/icons/hornsIcon.svg'

export type UserVariant = | 'large' | 'medium' | 'default'

export type UserProps = {
  /**
    * фото игрока
  */
  photo?: string;
  /**
    * никнейм игрока
  */
  name: string;
  /**
    * лжец ли игрок
  */
  isLzhets: boolean;
  /**
    * текущий игрок (ты)
  */
  isYou: boolean;
  /**
    * варианты размеров блока с игроком
  */
  variant?: UserVariant;
  className?: string;
}

/** 
 * отображение блока с игроком (фото, имя)
 * используется в компоненте показа подключившихся игроков
 * @see Users
*/
export const User: FC<UserProps> = ({ photo, name, variant = 'default', isLzhets, isYou, className }) => {
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