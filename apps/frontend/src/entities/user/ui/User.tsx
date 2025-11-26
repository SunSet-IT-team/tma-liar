import { FC } from "react"
import styles from '../style/userStyle.module.scss'
import noPhoto from '../../../assets/icons/blackPhoto.svg'
import { Typography } from "../../../shared/Typography/Typography";
import clsx from "clsx";
import hornsIcon from '../../../assets/icons/hornsIcon.svg'

export type UserVariant = | 'large' | 'medium' | 'default'

export type UserProps = {
  photo?: string;
  name: string;
  isLzhets: boolean;
  isYou: boolean;
  variant?: UserVariant;
  className?: string;
}

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