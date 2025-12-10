import { FC } from "react"
import { Popup } from "../../../../shared/ui/popup"
import { Typography } from "../../../../shared/ui/Typography"
import styles from '../../style/popupsStyle.module.scss'

type DeckPopupProps = {
  /** 
   * изменение показа попапа
  */
  changeShow: (show: boolean) => void
}

/** 
 * Попап информации о колоде
*/
export const DeckPopup: FC<DeckPopupProps> = ({ changeShow }) => {
  return (
    <Popup changeShow={changeShow} className={styles.deckPopupContent}>
      <Typography variant="titleLarge" className={styles.title}>18+</Typography>
      <div className={styles.deckParams}>
        <Typography>Вопросов:</Typography>
        <Typography>200</Typography>
      </div>
      <div className={styles.deckParams}>
        <Typography>Категории:</Typography>
        <Typography>демография, взрослое</Typography>
      </div>
      <Typography className={styles.dataDeck}>
        О колоде о колоде О колоде о колоде О колоде о колоде О колоде о колоде
      </Typography>
    </Popup>
  )
}