import { FC } from "react"
import { AnswersUserBadge } from "../../features/UsersBadge/ui/AnswersUsersBadge"
import { Button } from "../../shared/ui/Button"
import { Container } from "../../shared/ui/Container"
import { AnswersTimer } from "../../shared/ui/AnswersTimer"
import { Typography } from "../../shared/ui/Typography"
import { Header } from "../../widgets/Header"
import styles from './style/answersPlayersStyle.module.scss'
import { GameProcess } from "../../features/GameProcess"
import { useAppDispatch } from "../../app/store/hook"
import { stopTimer } from "../../entities/game/model/timerSlice"
import { useNavigate } from "react-router-dom"
import { PageRoutes } from "../../app/routes/pages"

/** 
 * Экран с ответами других игроков
*/
export const AnswersPlayers: FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  /** Переход на страницу результатов игры */
  const further = () => {
    dispatch(stopTimer())
    navigate(`/${PageRoutes.WAITING_PLAYERS}`, {
      state: {
        nextRoute: `/${PageRoutes.RESULT_GAME}`,
      },
    });
  }
  return (
    <Container>
      <Header inGame />
      <Typography as="h1" variant="titleLarge" className={styles.title}>Игроки</Typography>
      <Typography className={styles.answersText}>и их ответы</Typography>
      <AnswersUserBadge className={styles.answersPlayers} />
      <div className={styles.bottomBlock}>
        <Button className={styles.nextBtn} onClick={further}>Далее</Button>
        <AnswersTimer className={styles.time} />
      </div>
      <GameProcess route={`/${PageRoutes.RESULT_GAME}`} />
    </Container>
  )
}