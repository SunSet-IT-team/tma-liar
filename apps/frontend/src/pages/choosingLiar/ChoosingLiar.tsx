import { FC } from "react"
import { CustomButton } from "../../shared/CustomButton/CustomButton"
import { Taimer } from "../../shared/taimer/Taimer"
import styles from './style/choosingLiarStyle.module.scss'
import glob from '../../App.module.scss'
import clsx from "clsx"

/**
  * Страница с выбором вранья лжеца
*/

export const ChoosingLiar: FC = () => {
  return (
    <div className={clsx(styles.container, glob.container)}>
      <div className={styles.content}>
        <h1 className={styles.title}>Будешь врать?</h1>
        <div className={styles.choosingBtns}>
          <CustomButton>Да</CustomButton>
          <CustomButton>нет</CustomButton>
        </div>
      </div>
      <Taimer time={10} />
    </div>
  )
}