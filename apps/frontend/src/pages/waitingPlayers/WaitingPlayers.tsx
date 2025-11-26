import { FC } from "react"
import { Typography } from "../../shared/Typography/Typography"
import { Header } from "../../widgets/header/Header"
import styles from './style/waitingPlayersStyle.module.scss'
import glob from '../../App.module.scss'
import waitingIcon from '../../assets/icons/waitingIcon.svg'
import waitingCircle from '../../assets/icons/waitingCircle.svg'
import clsx from "clsx"

/** 
 * Показывается решало, когда лжец делает выбор
*/
export const WaitingPlayers: FC = () => {
  return (
    <div className={clsx(styles.container, glob.container)}>
      <Header className={styles.header} />
      <h1 className={styles.title}>Ждем!</h1>
      <Typography>Других игроков</Typography> 
      <img src={waitingIcon} alt="" className={styles.waitingIcon} />
      <img src={waitingCircle} alt="" className={styles.waitingCircle} />
      <Typography className={styles.waitingText}>Уже скоро?</Typography>
    </div>
  )
}