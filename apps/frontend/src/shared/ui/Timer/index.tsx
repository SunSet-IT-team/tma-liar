import { FC } from "react"
import styles from './style/taimerStyle.module.scss'
import taimerCircle from '../../../../public/icons/taimerCircle.svg'

type TaimerProps = {
  /**
    * Время, за которое будет действовать анимация
  */
  time: number;
}

/**
  * Отображение анимации исчезновения картинки с учетом времени (time)
  * Используется на странице выбора вранья лжеца
  * @see ChoosingLiar
*/
export const Timer: FC<TaimerProps> = ({ time }) => {
  return (
    <div className={styles.content}>
      <img src={taimerCircle} alt="" className={styles.taimerIcon} />
        <div className={styles.loaderWrapper}>
          <div
            className={styles.loader}
            style={{ animationDuration: `${time}s` }}
          />
        </div>
    </div>
  )
}