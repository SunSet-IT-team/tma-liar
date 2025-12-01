import { FC } from "react"
import { BackArrow } from "../../shared/backArrow/BackArrow"
import { Settings } from "../../shared/settings/Settings"
import styles from './style/rulesStyle.module.scss'
import glob from '../../App.module.scss'
import rulesIcon from '../../assets/icons/rulesIcon.svg'
import { Header } from "../../widgets/header/Header"
import clsx from "clsx"

/** 
 * Страница с правилами игры
*/
export const Rules: FC = () => {
  return (
    <div className={clsx(styles.container, glob.container)}>
      <Header variantSettings="white" className={styles.header} />
      <div className={styles.content}>
        <h1 className={styles.title}>
          Много
        </h1>
        <h2 className={styles.subtitle}>Очень много</h2>
        <span className={styles.rulesText}>Правила</span>
      </div>
      <div className={styles.rulesIconBlock}>
        <img src={rulesIcon} alt="" className={styles.rulesIcon} />
      </div>
    </div>
  )
}