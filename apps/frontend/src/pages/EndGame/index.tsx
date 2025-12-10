import { FC } from "react"
import { LobbyUsersBadge } from "../../features/UsersBadge/ui/LobbyUsersBadge"
import { Button } from "../../shared/ui/Button"
import { Container } from "../../shared/ui/Container"
import { Typography } from "../../shared/ui/Typography"
import { Header } from "../../widgets/Header"
import styles from './style/endGameStyle.module.scss'
import endIcon from '../../../public/icons/endIcon2.svg'

/** 
 * Экран, конец игры
*/
export const EndGame: FC = () => {
  return (
    <Container className={styles.container}>
      <Header className={styles.header} />
      <LobbyUsersBadge className={styles.playerName} />
      <Typography className={styles.playerPlace}>4 место</Typography>  
      <div className={styles.endButtons}>
        <Button className={styles.endBtn} variant='buttonUnderline'>Еще!</Button>
        <Button className={styles.endBtn} variant='buttonUnderline'>Выйти</Button>
      </div>
      <img src={endIcon} alt="" className={styles.endIcon} />
    </Container>
  )
}