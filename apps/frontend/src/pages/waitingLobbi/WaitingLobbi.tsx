import { FC } from "react"
import styles from './style/waitingLobbiStyle.module.scss'
import glob from '../../App.module.scss'
import clsx from "clsx"
import { Header } from "../../widgets/header/Header"
import { Typography } from "../../shared/Typography/Typography"
import { Users } from "../../features/users/Users"
import { TextInput } from "../../shared/TextInput/TextInput"

/** 
 * Экран ожидания игроков в лобби
*/
export const WaitingLobbi: FC = () => {
  return (
    <div className={clsx(glob.container, styles.container)}>
      <Header className={styles.header} />
      <div className={styles.lobbiBlock}>
        <Typography variant="titleLarge" as='h1' className={styles.lobbiTitle}>
          Лобби
        <Typography className={styles.lobbiCode}>#13HJ</Typography>
        </Typography>
      </div>
      <Users className={styles.players} />
      <div className={styles.taskBlock}>
        <Typography className={styles.taskLoserText}>Задание проигравшему</Typography>
        <TextInput placeholder="Task" className={styles.taskLoserWrapper} inputClassName={styles.taskLoserInput} />
        <Typography className={styles.connectedPlayers}>1/7</Typography>
      </div>
      <Typography as="button" variant="titleLarge" className={styles.readyBtn}>Начать</Typography>
    </div>
  )
}