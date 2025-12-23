import clsx from "clsx"
import { FC, useState } from "react"
import { Button } from "../../shared/ui/Button"
import styles from './style/answerSolvedBlockStyle.module.scss'

type SolvedBlockProps = {
  changeFix: (value: boolean) => void;
}

/** 
 * Блок выбора ответа решало
*/
export const AnswerSolvedBlock: FC<SolvedBlockProps> = ({ changeFix }) => {
  const [believe, setBelieve] = useState<boolean | null>(null)
  const [fixed, setFixed] = useState<boolean>(false)
  
  const solvedFix = () => {
    if (believe === null) return;
    setFixed(true);
    changeFix(true)
  }
  return (
    <>
      <div className={styles.answersBtns}>
        <Button 
          className={clsx(styles.answersBtn, !believe && styles.answersBtnActive)} 
          onClick={() => !fixed && setBelieve(false)}
        >
          Не верю
        </Button>
        <Button 
          className={clsx(styles.answersBtn, believe && styles.answersBtnActive)} 
          onClick={() => !fixed && setBelieve(true)}
          >
            Верю
        </Button>
      </div>
      <Button className={styles.fixAnswerBtn} onClick={solvedFix}>Зафиксировать</Button>
    </>
  )
}