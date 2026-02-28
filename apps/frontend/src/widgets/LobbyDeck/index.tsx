import { type FC, useState } from 'react';
import { DeckPopup } from '../../entities/popups/ui/DeckPopup';
import { DecksBlock, testDecks } from '../../features/DecksBlock';
import { Button } from '../../shared/ui/Button';
import { Typography } from '../../shared/ui/Typography';
import styles from './style/lobbyDeckStyle.module.scss';

type LobbyDeckProps = {
  onChangeActiveDeck?: (index: number) => void;
};

/**
 * Отображение информации о колодах
 */
export const LobbyDeck: FC<LobbyDeckProps> = ({ onChangeActiveDeck }) => {
  const [showDeck, setShowDeck] = useState<boolean>(false);
  const [activeDeckIndex, setActiveDeckIndex] = useState<number>(0);
  const activeDeck = testDecks[activeDeckIndex];

  const handleChangeActiveDeck = (index: number) => {
    setActiveDeckIndex(index);
    onChangeActiveDeck?.(index);
  };

  return (
    <>
      <div className={styles.deckBlock}>
        <Typography className={styles.deckText}>Колода</Typography>
        <DecksBlock onChangeActiveDeck={handleChangeActiveDeck} />
        <Button onClick={() => setShowDeck(true)}>О колоде</Button>
      </div>
      {showDeck && (
        <DeckPopup changeShow={(show: boolean) => setShowDeck(show)} deck={activeDeck} />
      )}
    </>
  );
};
