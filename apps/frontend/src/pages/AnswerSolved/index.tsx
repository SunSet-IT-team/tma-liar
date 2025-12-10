import { FC, useState } from "react"
import { LeavePopup } from "../../entities/popups/ui/LeavePopup"
import { UserBadge } from "../../entities/user/ui/UserBadge"
import { Button } from "../../shared/ui/Button"
import { Container } from "../../shared/ui/Container"
import { Timer } from "../../shared/ui/Timer"
import { Typography } from "../../shared/ui/Typography"
import { Header } from "../../widgets/Header"
import styles from './style/answerSolvedStyle.module.scss'

/** 
 * Экран с вариантами ответов для решало
*/
export const AnswerSolved: FC = () => {
  const [leaveLobby, setLeaveLobbi] = useState<boolean>(false)

  return (
    <Container>
      <Header className={styles.header} leaveLobby={(value: boolean) => setLeaveLobbi(value)} />
      <div className={styles.content}>
        <Typography as='h1' variant='titleLarge'>
          Лжец
          <Typography as='span' variant='titleLarge' className={styles.titleItem}>?</Typography>
        </Typography>
        <UserBadge id={1} name="Хаах Татар" className={styles.liarPlayer} />
        <Typography className={styles.questionLiar}>Вопрос заданный лжецу</Typography>
      </div>
      
      <div className={styles.answersBtns}>
        <Button className={styles.answersBtn}>Не верю</Button>
        <Button className={styles.answersBtn}>Верю</Button>
      </div>
      <Button className={styles.fixAnswerBtn}>Зафиксировать</Button>
      <Timer time={10} />
      {leaveLobby &&
        <LeavePopup changeShow={(show: boolean) => setLeaveLobbi(show)} popupStyle='red' />
      }
    </Container>
  )
}