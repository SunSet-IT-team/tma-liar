import { FC } from "react"
import { CustomButton } from "../../shared/CustomButton/CustomButton"
import { Taimer } from "../../shared/taimer/Taimer"
import styles from './style/choosingLiarStyle.module.scss'

export const ChoosingLiar: FC = () => {
  return (
    <div className={styles.container}>
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