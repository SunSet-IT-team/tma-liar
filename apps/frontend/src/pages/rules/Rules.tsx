import { FC } from "react"
import { BackArrow } from "../../components/backArrow/BackArrow"
import { Settings } from "../../components/settings/Settings"
import styles from './style/rulesStyle.module.scss'
import rulesIcon from '../../assets/icons/rulesIcon.svg'

export const Rules: FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <BackArrow />
        <Settings variant="white" />
      </div>
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