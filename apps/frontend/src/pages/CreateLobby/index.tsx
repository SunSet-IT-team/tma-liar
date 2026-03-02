import { type FC } from 'react';
import { Button } from '../../shared/ui/Button';
import styles from './style/createLobbyStyle.module.scss';
import lobbyCircle from '/icons/lobbyCircle.svg';
import { Header } from '../../widgets/Header';
import { ChoiceParamsLobby } from '../../widgets/ChoiceParamsLobby';
import { Typography } from '../../shared/ui/Typography';
import { Container } from '../../shared/ui/Container';
import { LobbyDeck } from '../../widgets/LobbyDeck';
import { useCreateLobby } from '@features/CreateLobby';

/**
 * Экран создания лобби
 */
export const CreateLobby: FC = () => {
  const {
    questionCount,
    answerTime,
    decks,
    activeDeckIndex,
    isDecksLoading,
    isBuyingDeck,
    isSubmitting,
    errorText,
    isGuest,
    isSelectedDeckLocked,
    telegramBotUrl,
    setQuestionCount,
    setAnswerTime,
    setActiveDeckIndex,
    createLobby,
    buySelectedDeck,
  } = useCreateLobby();

  return (
    <Container className={styles.container}>
      <Header />
      <Typography variant="titleLarge" as="h1" className={styles.lobbyTitle}>
        Лобби
      </Typography>
      <ChoiceParamsLobby
        reusedValues={{ min: 10, max: 200, step: 5, defaultValue: questionCount }}
        choiceText="Кол-во вопросов"
        choiceType="В"
        onChangeValue={(value: number) => setQuestionCount(value)}
      />
      <ChoiceParamsLobby
        reusedValues={{ min: 5, max: 60, step: 5, defaultValue: answerTime }}
        choiceText="Таймер"
        choiceType="С"
        onChangeValue={(value: number) => setAnswerTime(value)}
      />
      {isDecksLoading ? (
        <Typography>Загружаем колоды...</Typography>
      ) : (
        <LobbyDeck decks={decks} activeDeckIndex={activeDeckIndex} onChangeActiveDeck={setActiveDeckIndex} />
      )}
      {isGuest ? (
        <div className={styles.guestAuthBlock}>
          <Typography className={styles.guestAuthText}>
            Чтобы создавать лобби, нужно войти через Telegram
          </Typography>
          <Button
            variant="buttonUnderline"
            onClick={() => window.open(telegramBotUrl, '_blank', 'noopener,noreferrer')}
          >
            Войти
          </Button>
        </div>
      ) : (
        <Button
          variant="buttonUnderline"
          soundTrigger="click"
          onClick={isSelectedDeckLocked ? buySelectedDeck : createLobby}
          disabled={isSubmitting || isDecksLoading || decks.length === 0 || isBuyingDeck}
        >
          {isSelectedDeckLocked
            ? isBuyingDeck
              ? 'Переходим к оплате...'
              : `Купить колоду за ${decks[activeDeckIndex]?.priceRub ?? 0} ₽`
            : isSubmitting
              ? 'Создаю...'
              : 'Создать'}
        </Button>
      )}
      {errorText && <Typography>{errorText}</Typography>}
      <img src={lobbyCircle} alt="" className={styles.lobbyCircle} data-decor="true" />
    </Container>
  );
};
