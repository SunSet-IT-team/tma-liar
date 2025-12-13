import { FC } from "react"
import { PageRoutes } from "../../app/routes/pages"
import { GameProcess } from "../../features/GameProcess"
import { Container } from "../../shared/ui/Container"
import { Timer } from "../../shared/ui/Timer"
import { Typography } from "../../shared/ui/Typography"
import { Header } from "../../widgets/Header"
import styles from './style/answerLiarStyle.module.scss'

/** 
 * Экран с вопросом для лжеца
*/
export const AnswerLiar: FC = () => {
  return (
    <Container>
      <Header className={styles.header} inGame />
      <div className={styles.content}>
        <Typography variant="titleLarge" as="h1" className={styles.title}>
          Вопрос
          <Typography as="span" className={styles.titleItem} variant="titleLarge">,</Typography>
        </Typography>
        <Typography>Здесь будет вопрос...</Typography>
      </div>
      <GameProcess route={`/${PageRoutes.ANSWERS_PLAYERS}`} />
      <Timer />
    </Container>
  )
}