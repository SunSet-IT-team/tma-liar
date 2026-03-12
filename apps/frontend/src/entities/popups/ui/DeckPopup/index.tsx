import { type FC } from 'react';
import { Popup } from '../../../../shared/ui/Popup';
import { Typography } from '../../../../shared/ui/Typography';
import styles from '../../style/popupsStyle.module.scss';
import type { Deck } from '../../../../shared/types/deck';

type DeckPopupProps = {
  /**
   * Изменение показа попапа
   */
  changeShow: (show: boolean) => void;
  /**
   * Колода
   */
  deck: Deck;
};

/**
 * Попап информации о колоде
 */
export const DeckPopup: FC<DeckPopupProps> = ({ changeShow, deck }) => {
  return (
    <Popup changeShow={changeShow} className={styles.deckPopupContent}>
      <Typography as="span" variant="titleLarge" className={styles.title}>
        {deck.name}
      </Typography>
      <Typography as="span" variant="titleLarge" className={styles.title}>
        {(deck.ageLimit ?? 0) > 0 ? `${deck.ageLimit}+` : '0+'}
      </Typography>
      <div className={styles.deckParams}>
        <Typography>Вопросов:</Typography>
        <Typography>{deck.questionsCount ?? deck.questions.length}</Typography>
      </div>
      <div className={styles.deckParams}>
        <Typography>Категории:</Typography>
        {(deck.categories ?? ['Общее']).map((category: string) => (
          <Typography key={category}>{category}</Typography>
        ))}
      </div>
      <Typography className={styles.dataDeck}>
        {deck.description ?? 'Описание колоды будет добавлено позже'}
      </Typography>
    </Popup>
  );
};
