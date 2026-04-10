import { type FC } from 'react';
import { Button } from '../../shared/ui/Button';
import styles from './style/createLobbyStyle.module.scss';
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
    isBuyingDeckWithBalance,
    balanceRub,
    isSubmitting,
    isGuest,
    isSelectedDeckLocked,
    telegramBotUrl,
    setQuestionCount,
    setAnswerTime,
    setActiveDeckIndex,
    createLobby,
    buySelectedDeck,
    buySelectedDeckWithBalance,
  } = useCreateLobby();

  const maxQuestions = decks[activeDeckIndex]?.questionsCount ?? 200;
  const deckPriceRub = Math.max(0, Math.round(decks[activeDeckIndex]?.priceRub ?? 0));
  const canPayFromBalance =
    balanceRub !== null && deckPriceRub > 0 && balanceRub >= deckPriceRub;

  return (
    <Container className={styles.container}>
      <Header />
      <Typography variant="titleLarge" as="h1" className={styles.lobbyTitle}>
        Лобби
      </Typography>
      <ChoiceParamsLobby
        reusedValues={{ min: 1, max: maxQuestions, step: 1, defaultValue: questionCount }}
        choiceText="Кол-во вопросов"
        choiceType="В"
        onChangeValue={(value: number) => setQuestionCount(value)}
      />
      <ChoiceParamsLobby
        reusedValues={{ min: 5, max: 180, step: 5, defaultValue: answerTime }}
        choiceText="Таймер"
        choiceType="С"
        onChangeValue={(value: number) => setAnswerTime(value)}
      />
      {isGuest ?
      <> </> : 
      (isDecksLoading ? (
        <Typography>Загружаем колоды...</Typography>
      ) : (
        <LobbyDeck decks={decks} activeDeckIndex={activeDeckIndex} onChangeActiveDeck={setActiveDeckIndex} />
      ))}
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
      ) : isSelectedDeckLocked ? (
        <div className={styles.purchaseActions}>
          {balanceRub !== null ? (
            <Typography className={styles.balanceHint}>Баланс: {balanceRub} ₽</Typography>
          ) : null}
          <Button
            variant="buttonUnderline"
            soundTrigger="click"
            onClick={buySelectedDeckWithBalance}
            disabled={
              isSubmitting ||
              isDecksLoading ||
              decks.length === 0 ||
              isBuyingDeck ||
              isBuyingDeckWithBalance ||
              !canPayFromBalance
            }
          >
            {isBuyingDeckWithBalance
              ? 'Покупаем...'
              : `С баланса — ${deckPriceRub} ₽`}
          </Button>
          <Button
            variant="buttonUnderline"
            soundTrigger="click"
            onClick={buySelectedDeck}
            disabled={
              isSubmitting || isDecksLoading || decks.length === 0 || isBuyingDeck || isBuyingDeckWithBalance
            }
          >
            {isBuyingDeck ? 'Переходим к оплате...' : `Картой (ЮKassa) — ${deckPriceRub} ₽`}
          </Button>
        </div>
      ) : (
        <Button
          variant="buttonUnderline"
          soundTrigger="click"
          onClick={createLobby}
          disabled={isSubmitting || isDecksLoading || decks.length === 0}
        >
          {isSubmitting ? 'Создаю...' : 'Создать'}
        </Button>
      )}
      <div className={styles.lobbyCircle} data-decor="true" />
    </Container>
  );
};
