import { FC, useState } from "react"
import { DeckPopup } from "../../entities/popups/ui/DeckPopup";
import { DecksBlock, testDecks } from "../../features/DecksBlock";
import { Button } from "../../shared/ui/Button";
import { Typography } from "../../shared/ui/Typography";
import styles from './style/lobbyDeckStyle.module.scss'

/** 
 * Отображение информации о колодах
*/
export const LobbyDeck: FC = () => {
  const [showDeck, setShowDeck] = useState<boolean>(false);
  const [activeDeckIndex, setActiveDeckIndex] = useState<number>(0);
  const activeDeck = testDecks[activeDeckIndex];
  
  return (
    <>
      <div className={styles.deckBlock}>
        <Typography className={styles.deckText}>Колода</Typography>
        <DecksBlock onChangeActiveDeck={setActiveDeckIndex} />
        <Button onClick={() => setShowDeck(true)}>О колоде</Button>
      </div>
      {showDeck &&
        <DeckPopup changeShow={(show: boolean) => setShowDeck(show)} deck={activeDeck} />  
      }
    </>
  )
}