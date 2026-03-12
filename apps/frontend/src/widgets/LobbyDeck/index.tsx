import { type FC, useState } from 'react';
import { DeckPopup } from '../../entities/popups/ui/DeckPopup';
import { DecksBlock } from '../../features/DecksBlock';
import { Button } from '../../shared/ui/Button';
import { Typography } from '../../shared/ui/Typography';
import styles from './style/lobbyDeckStyle.module.scss';
import type { Deck } from '../../shared/types/deck';

type LobbyDeckProps = {
  decks: Deck[];
  activeDeckIndex: number;
  onChangeActiveDeck?: (index: number) => void;
};

/**
 * Отображение информации о колодах
 */
export const LobbyDeck: FC<LobbyDeckProps> = ({
  decks,
  activeDeckIndex,
  onChangeActiveDeck,
}) => {
  const [showDeck, setShowDeck] = useState<boolean>(false);
  const activeDeck = decks[activeDeckIndex];

  const handleChangeActiveDeck = (index: number) => {
    onChangeActiveDeck?.(index);
  };

  if (!activeDeck) {
    return null;
  }

  return (
    <>
      <div className={styles.deckBlock}>
        <Typography className={styles.deckText}>Колода</Typography>
        <DecksBlock decks={decks} onChangeActiveDeck={handleChangeActiveDeck} />
        <Button onClick={() => setShowDeck(true)}>О колоде</Button>
      </div>
      {showDeck && (
        <DeckPopup changeShow={(show: boolean) => setShowDeck(show)} deck={activeDeck} />
      )}
    </>
  );
};
