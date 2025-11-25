import { FC } from "react"
import { BackArrow } from "../../shared/backArrow/BackArrow"
import { Settings } from "../../shared/settings/Settings"
import styles from './style/rulesStyle.module.scss'
import rulesIcon from '../../assets/icons/rulesIcon.svg'
import { Header } from "../../widgets/header/Header"

export const Rules: FC = () => {
  return (
    <div className={styles.container}>
      <Header variantSettings="white" className={styles.header} />
      <h1 className={styles.title}>
        Много
      </h1>
      <h2 className={styles.subtitle}>Очень много</h2>
      <span className={styles.rulesText}>Правила</span>
      <div className={styles.rulesIconBlock}>
        <img src={rulesIcon} alt="" className={styles.rulesIcon} />
      </div>
    </div>
  )
}