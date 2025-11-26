import { FC } from "react"
import styles from './style/taimerStyle.module.scss'
import taimerCircle from '../../assets/icons/taimerCircle.svg'
import clsx from "clsx";

type TaimerProps = {
  time: number;
}

export const Taimer: FC<TaimerProps> = ({ time }) => {
  return (
    <>
    <div className={styles.content}>
      <img src={taimerCircle} alt="" className={styles.taimerIcon} />
        <div className={styles.loaderWrapper}>
          <div
            className={styles.loader}
            style={{ animationDuration: `${time}s` }}
          />
        </div>
    </div>
      
    </>
  )
}