import { FC } from "react"
import { Container } from "../../shared/ui/Container"
import { Timer } from "../../shared/ui/Timer"
import { Typography } from "../../shared/ui/Typography"
import { Header } from "../../widgets/Header"
import styles from './style/answerLiarStyle.module.scss'

export const AnswerLiar: FC = () => {
  return (
    <Container>
      <Header className={styles.header} />
      <div className={styles.content}>
        <Typography variant="titleLarge" as="h1" className={styles.title}>
          Вопрос
          <Typography as="span" className={styles.titleItem} variant="titleLarge">,</Typography>
        </Typography>
        <Typography>Здесь будет вопрос...</Typography>
      </div>
      
      <Timer time={10} />
    </Container>
  )
}