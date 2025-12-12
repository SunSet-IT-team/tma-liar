import { FC } from "react"
import styles from './style/connectLobbyStyle.module.scss'
import { Container } from "../../shared/ui/Container"
import { Header } from "../../widgets/Header"
import { Typography } from "../../shared/ui/Typography"
import { TextInput } from "../../shared/ui/TextInput"
import { Button } from "../../shared/ui/Button"
import { UserBadge } from "../../entities/user/ui/UserBadge"
import circleIcon from '../../../public/icons/profileCircle.svg'

/** 
  * Экран присоединения к лобби
*/
export const ConnectLobby: FC = () => {
  return (
    <Container>
      <Header />
      <Typography as="h1" variant="titleLarge" className={styles.title}>
        <Typography as="span" variant='titleLarge'>
          Код
        </Typography>
        Лобби
      </Typography>
      <TextInput placeholder="task" className={styles.lobbyInput} />
      <Button className={styles.connectBtn}>Присоедениться</Button>
      <UserBadge variant="large" id={1} name='Бешеный татар' />
      <img src={circleIcon} alt="" className={styles.circleIcon} />
    </Container>
  )
}