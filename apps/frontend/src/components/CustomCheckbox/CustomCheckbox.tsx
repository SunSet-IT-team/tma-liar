import { FC } from 'react'
import styles from './style/checkboxStyle.module.scss'

export const CustomCheckbox: FC = () => {
  return (
    <label className={styles.content}>
      <input type="checkbox" className={styles.check} />
      <span className={styles.checkmark}></span>
    </label>
  )
}