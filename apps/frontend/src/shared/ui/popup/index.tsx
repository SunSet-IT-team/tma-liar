import clsx from "clsx";
import { FC, ReactNode } from "react"
import { usePlaySound } from "../../lib/sound/usePlaySound";
import styles from './style/popupStyle.module.scss'

type PopupProps = {
  className?: string;
  children: ReactNode;
  /** 
   * изменение показа попапа
  */
  changeShow: (show: boolean) => void;
}

/** 
 * Попап скелет
*/
export const Popup: FC<PopupProps> = ({ className, children, changeShow }) => {
  const playSound = usePlaySound();
  const closePopup = () => {
    playSound();
    changeShow(false)
  }
  return (
    <div className={styles.container}>
      <div className={clsx(styles.content, className)}>
        {children}
      </div>
      <div className={styles.closedPlace} onClick={closePopup}></div>
    </div>
  )
}