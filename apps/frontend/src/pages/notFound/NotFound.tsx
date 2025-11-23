import { FC } from "react"
import styles from './style/notFoundStyle.module.scss'
import glob from '../../App.module.scss'
import clsx from "clsx"
import { BackArrow } from "../../components/backArrow/BackArrow"
import { Settings } from "../../components/settings/Settings"
import notFoundIcon from '../../assets/icons/notFoundIcon.svg'

export const NotFound: FC = () => {
  return (
    <div className={clsx(glob.container, styles.container)}>
      <div className={styles.header}>
        <BackArrow variant="white" />
        <Settings variant="white" />
      </div>
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