import { FC } from "react"
import { Typography } from "../../shared/ui/Typography"
import { Header } from "../../widgets/Header"
import styles from './style/waitingPlayersStyle.module.scss'
import waitingIcon from '../../../public/icons/waitingIcon.svg'
import waitingCircle from '../../../public/icons/waitingCircle.svg'
import { Container } from "../../shared/ui/Container"

/** 
 * Экран показывается решало, когда лжец делает выбор
*/
export const WaitingPlayers: FC = () => {
  return (
    <Container className={styles.container}>
      <Header className={styles.header} />
      <Typography className={styles.title} variant='titleLarge'>Ждем!</Typography>
      <Typography>Других игроков</Typography> 
      <img src={waitingIcon} alt="" className={styles.waitingIcon} />
      <img src={waitingCircle} alt="" className={styles.waitingCircle} />
      <Typography className={styles.waitingText}>Уже скоро?</Typography>
    </Container>
  )
}