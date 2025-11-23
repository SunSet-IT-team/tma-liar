import clsx from "clsx"
import { FC } from "react"
import glob from '../../App.module.scss'
import { BackArrow } from "../../components/backArrow/BackArrow"
import { CustomButton } from "../../components/CustomButton/CustomButton"
import { ValueScroller } from "../../components/ValueScroller/ValueScroller"
import styles from './style/createLobbiStyle.module.scss'
import circleIcon from '../../assets/icons/homeCircle.svg'
import { DecksBlock } from "../../components/decksBlock/DecksBlock"
import { Settings } from "../../components/settings/Settings"

export const CreateLobbi: FC = () => {
  return (
    <div className={clsx(glob.container, styles.container)}>
      <div className={styles.lobbiStyle}>
        <BackArrow />
        <Settings />
      </div>
      <h1 className={styles.lobbiTitle}>
        Лобби
      </h1>
      <div className={clsx(styles.counts, styles.lobbiStyle)}>
        <span className={clsx(styles.lobbiText, styles.questionsText)}>Кол-во вопросов</span>
        <ValueScroller min={10} max={200} step={5} defaultValue={20}>
          <span className={clsx(styles.lobbiText, styles.scrollerType)}>В</span>
        </ValueScroller>
      </div>
      <div className={clsx(styles.counts, styles.lobbiStyle)}>
        <span className={styles.lobbiText}>Таймер</span>
        <ValueScroller min={5} max={60} step={5}>
          <span className={clsx(styles.lobbiText, styles.scrollerType)}>С</span>
        </ValueScroller>
      </div>
      <div className={styles.deckBlock}>
        <span className={clsx(styles.lobbiText, styles.deckText)}>Колода</span>
        <DecksBlock />
        <CustomButton>О колоде</CustomButton>
      </div>
      
      <CustomButton variant="buttonUnderline">Создать</CustomButton>
      <img src={circleIcon} alt="" className={styles.lobbiCircle} />
    </div>
  )
}