import { FC } from "react"
import { AnswersUserBadge } from "../../features/UsersBadge/ui/AnswersUsersBadge"
import { Button } from "../../shared/ui/Button"
import { Container } from "../../shared/ui/Container"
import { Typography } from "../../shared/ui/Typography"
import { Header } from "../../widgets/Header"
import styles from './style/answersPlayersStyle.module.scss'

export const AnswersPlayers: FC = () => {
  return (
    <Container>
      <Header />
      <Typography as="h1" variant="titleLarge" className={styles.title}>Игроки</Typography>
      <Typography className={styles.answersText}>и их ответы</Typography>
      <AnswersUserBadge />
      <div className={styles.bottomBlock}>
        <Button className={styles.nextBtn}>Далее</Button>
        <Typography className={styles.time}>10 с</Typography>
      </div>
    </Container>
  )
}