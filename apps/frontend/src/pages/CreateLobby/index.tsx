import { FC } from "react"
import { Button } from "../../shared/ui/Button"
import styles from './style/createLobbyStyle.module.scss'
import lobbyCircle from '../../../public/icons/lobbyCircle.svg'
import { DecksBlock } from "../../features/DecksBlock"
import { Header } from "../../widgets/Header"
import { ChoiceParamsLobby } from "../../widgets/ChoiceParamsLobby"
import { Typography } from "../../shared/ui/Typography"
import { Container } from "../../shared/ui/Container"

/** 
 * Экран создания лобби
*/
export const CreateLobby: FC = () => {
  return (
    <Container className={styles.container}>
      <Header />
      <Typography variant="titleLarge" as='h1' className={styles.lobbyTitle}>
        Лобби
      </Typography>
      <ChoiceParamsLobby reusedValues={{ min: 10, max: 200, step: 5, defaultValue: 20 }}  choiceText='Кол-во вопросов' choiceType="В" />
      <ChoiceParamsLobby reusedValues={{ min: 5, max: 60, step: 5 }} choiceText='Таймер' choiceType="С" />
      <div className={styles.deckBlock}>
        <Typography className={styles.deckText}>Колода</Typography>
        <DecksBlock />
        <Button>О колоде</Button>
      </div>
      <Button variant="buttonUnderline">Создать</Button>
      <img src={lobbyCircle} alt="" className={styles.lobbyCircle} />
    </Container>
  )
}