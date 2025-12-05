import { FC } from "react"
import styles from './style/waitingLobbyStyle.module.scss'
import { Header } from "../../widgets/Header"
import { Typography } from "../../shared/ui/Typography"
import { LobbyUsersBadge } from "../../features/UsersBadge/ui/LobbyUsersBadge"
import { TextInput } from "../../shared/ui/TextInput"
import { Container } from "../../shared/ui/Container"

/** 
 * Экран ожидания игроков в лобби
*/
export const WaitingLobby: FC = () => {
  return (
    <Container className={styles.container}>
      <Header className={styles.header} />
      <div className={styles.lobbyBlock}>
        <Typography variant="titleLarge" as='h1' className={styles.lobbyTitle}>
          Лобби
        <Typography className={styles.lobbyCode}>#13HJ</Typography>
        </Typography>
      </div>
      <LobbyUsersBadge className={styles.players} />
      <div className={styles.taskBlock}>
        <Typography className={styles.taskLoserText}>Задание проигравшему</Typography>
        <TextInput placeholder="Task" className={styles.taskLoserWrapper} inputClassName={styles.taskLoserInput} />
        <Typography className={styles.connectedPlayers}>1/7</Typography>
      </div>
      <Typography as="button" variant="titleLarge" className={styles.readyBtn}>Начать</Typography>
    </Container>
  )
}