import clsx from "clsx"
import { FC } from "react"
import glob from '../../App.module.scss'
import { CustomButton } from "../../shared/CustomButton/CustomButton"
import styles from './style/createLobbiStyle.module.scss'
import lobbiCircle from '../../assets/icons/lobbiCircle.svg'
import { DecksBlock } from "../../features/decksBlock/DecksBlock"
import { Header } from "../../widgets/header/Header"
import { ChoiceParamsLobbi } from "../../widgets/choiceParamsLobbi/ChoiceParamsLobbi"
import { Typography } from "../../shared/Typography/Typography"

export const CreateLobbi: FC = () => {
  return (
    <div className={clsx(glob.container, styles.container)}>
      <Header />
      <Typography variant="titleLarge" as='h1' className={styles.lobbiTitle}>
        Лобби
      </Typography>
      <ChoiceParamsLobbi min={10} max={200} step={5} defaultValue={20} choiceText='Кол-во вопросов' choiceType="В" />
      <ChoiceParamsLobbi min={5} max={60} step={5} choiceText='Таймер' choiceType="С" />
      <div className={styles.deckBlock}>
        <span className={clsx(styles.lobbiText, styles.deckText)}>Колода</span>
        <DecksBlock />
        <CustomButton>О колоде</CustomButton>
      </div>
      <CustomButton variant="buttonUnderline">Создать</CustomButton>
      <img src={lobbiCircle} alt="" className={styles.lobbiCircle} />
    </div>
  )
}