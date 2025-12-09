import { FC, useState } from "react"
import { ResultUsersBadge } from "../../features/UsersBadge/ui/ResultUsersBadge"
import { Button } from "../../shared/ui/Button"
import { Container } from "../../shared/ui/Container"
import { Header } from "../../widgets/Header"
import styles from './style/resultGameStyle.module.scss'

/** 
 * Экран, отображение результатов игры
*/
export const ResultGame: FC = () => {
  const [task, setTask] = useState<string>("Здесь будет задание...");

  return (
    <Container>
      <Header />
      <ResultUsersBadge onRevealTask={setTask} />
    </Container>
  )
}