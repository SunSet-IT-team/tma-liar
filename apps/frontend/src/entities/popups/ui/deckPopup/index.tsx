import { FC } from "react"
import { Popup } from "../../../../shared/ui/Popup"
import { Typography } from "../../../../shared/ui/Typography"
import styles from '../../style/popupsStyle.module.scss'

type DeckPopupProps = {
  /** 
   * Изменение показа попапа
  */
  changeShow: (show: boolean) => void;
  /** 
   * Колода
  */
  deck: {
    ageLimit: number;
    questions: string[];
    categories: string[];
  };
}

/** 
 * Попап информации о колоде
*/
export const DeckPopup: FC<DeckPopupProps> = ({ changeShow, deck }) => {
  return (
    <Popup changeShow={changeShow} className={styles.deckPopupContent}>
      <Typography as="span" variant="titleLarge" className={styles.title}>{deck.ageLimit}+</Typography>
      <div className={styles.deckParams}>
        <Typography>Вопросов:</Typography>
        <Typography>{deck.questions.length}</Typography>
      </div>
      <div className={styles.deckParams}>
        <Typography>Категории:</Typography>
          {deck.categories.map((category: string) => (
            <Typography>{category}</Typography>
          ))}
      </div>
      <Typography className={styles.dataDeck}>
        О колоде о колоде О колоде о колоде О колоде
      </Typography>
    </Popup>
  )
}