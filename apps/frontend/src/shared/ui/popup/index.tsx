import clsx from "clsx";
import { FC, ReactNode, useState } from "react"
import styles from './style/popupStyle.module.scss'

type PopupProps = {
  className?: string;
  children: ReactNode;
  changeShow: (show: boolean) => void
}

export const Popup: FC<PopupProps> = ({ className, children, changeShow }) => {

  return (
    <div className={styles.container}>
      <div className={clsx(styles.content, className)}>
        {children}
      </div>
      <div className={styles.closedPlace} onClick={() => changeShow(false)}></div>
    </div>
    
  )
}