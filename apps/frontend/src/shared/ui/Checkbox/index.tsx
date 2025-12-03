import { FC, useState } from 'react'
import styles from './style/checkboxStyle.module.scss'

type CheckboxProps = {
  onChange: (value: boolean) => void;
}

/** 
 * Чекбокс с кастомной иконкой
 * Будет использоваться в оценке других игроков
*/
export const Checkbox: FC<CheckboxProps> = ({ onChange }) => {
  const [checked, setChecked] = useState<boolean>(false)

  return (
    <label className={styles.content} onClick={() => onChange(!checked)}>
      <input type="checkbox" className={styles.check} />
      <span className={styles.checkmark}></span>
    </label>
  )
}