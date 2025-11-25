import { FC } from "react"
import styles from './style/notFoundStyle.module.scss'
import glob from '../../App.module.scss'
import clsx from "clsx"
import { BackArrow } from "../../shared/backArrow/BackArrow"
import { Settings } from "../../shared/settings/Settings"
import notFoundIcon from '../../assets/icons/notFoundIcon.svg'
import { Header } from "../../widgets/header/Header"

export const NotFound: FC = () => {
  return (
    <div className={clsx(glob.container, styles.container)}>
      <Header variantArrow="white" variantSettings="white" />
      <div className={styles.errorBlock}>
        <h1 className={styles.title}>404</h1>
        <p className={styles.errorText}>Досадная ошибка</p>
      </div>
      <div className={styles.notFoundBlock}>
        <span className={styles.notFoundText}>Ну а <br /> я что ?</span>
      </div>
      <img className={styles.notFoundIcon} src={notFoundIcon} alt="" />
    </div>
  )
}