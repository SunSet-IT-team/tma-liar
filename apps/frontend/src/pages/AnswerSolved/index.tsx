import { FC, useState } from "react"
import { PageRoutes } from "../../app/routes/pages"
import { UserBadge } from "../../entities/user/ui/UserBadge"
import { GameProcess } from "../../features/GameProcess"
import { Container } from "../../shared/ui/Container"
import { Timer } from "../../shared/ui/Timer"
import { Typography } from "../../shared/ui/Typography"
import { AnswerSolvedBlock } from "../../widgets/AnswerSolvedBlock"
import { Header } from "../../widgets/Header"
import styles from './style/answerSolvedStyle.module.scss'

/** 
 * Экран с вариантами ответов для решало
*/
export const AnswerSolved: FC = () => {
  const [fixed, setFixed] = useState<boolean>(false)

  return (
    <Container>
      <Header className={styles.header} inGame />
      <div className={styles.content}>
        <Typography as='h1' variant='titleLarge'>
          Лжец
          <Typography as='span' variant='titleLarge' className={styles.titleItem}>?</Typography>
        </Typography>
        <UserBadge id={1} name="Хаах Татар" className={styles.liarPlayer} />
        <Typography className={styles.questionLiar}>Вопрос заданный лжецу</Typography>
      </div>
      <AnswerSolvedBlock changeFix={(value: boolean) => setFixed(value)} />
      <Timer />
      <GameProcess route={`/${PageRoutes.RATE_PLAYERS}`} isFixed={fixed} />
    </Container>
  )
}