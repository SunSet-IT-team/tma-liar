import { useState, type FC } from 'react';
import { Button } from '../../shared/ui/Button';
import styles from './style/createLobbyStyle.module.scss';
import lobbyCircle from '/icons/lobbyCircle.svg';
import { Header } from '../../widgets/Header';
import { ChoiceParamsLobby } from '../../widgets/ChoiceParamsLobby';
import { Typography } from '../../shared/ui/Typography';
import { Container } from '../../shared/ui/Container';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../app/routes/pages';
import { LobbyDeck } from '../../widgets/LobbyDeck';
import { testDecks } from '../../features/DecksBlock';
import { createLobbyRequest } from '../../shared/services/lobby/lobby.api';
import { getCurrentTmaUser, isGuestUser } from '../../shared/lib/tma/user';
import { lobbySessionService } from '../../shared/services/lobby/lobby-session.service';
import type { LobbyDeck as BackendLobbyDeck } from '../../shared/types/lobby';

function mapDeckToBackendDeck(deck: (typeof testDecks)[number], deckIndex: number): BackendLobbyDeck {
  return {
    name: `Колода ${deckIndex + 1}`,
    questionsCount: deck.questions.length,
    cover: '/icons/blackPhoto.svg',
    questions: deck.questions.map((content, index) => ({
      id: `deck-${deckIndex + 1}-q-${index + 1}`,
      type: 'general',
      content,
      complexity: 1,
    })),
  };
}

/**
 * Экран создания лобби
 */
export const CreateLobby: FC = () => {
  const navigate = useNavigate();
  const [questionCount, setQuestionCount] = useState<number>(30);
  const [answerTime, setAnswerTime] = useState<number>(20);
  const [activeDeckIndex, setActiveDeckIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const user = getCurrentTmaUser();
  const isGuest = isGuestUser(user);
  const telegramBotUrl = import.meta.env.VITE_TELEGRAM_BOT_URL ?? 'https://t.me/';

  const createLobby = async () => {
    if (isSubmitting) return;

    if (isGuest) {
      setErrorText('Создание лобби доступно только при входе через Telegram.');
      return;
    }

    setIsSubmitting(true);
    setErrorText(null);

    try {
      const selectedDeck = mapDeckToBackendDeck(testDecks[activeDeckIndex], activeDeckIndex);
      const normalizedQuestionCount = Math.min(questionCount, selectedDeck.questions.length);

      const lobby = await createLobbyRequest({
        settings: {
          deckId: `test-deck-${activeDeckIndex + 1}`,
          questionCount: normalizedQuestionCount,
          answerTime,
          deck: selectedDeck,
        },
        nickname: user.nickname,
        profileImg: user.profileImg,
        loserTask: '',
      });

      lobbySessionService.set({
        lobbyCode: lobby.lobbyCode,
        adminId: lobby.adminId,
        currentGameId: lobby.currentGameId ?? null,
        status: lobby.status,
        currentStage: null,
        players: lobby.players.map((p) => ({
          id: p.id,
          nickname: p.nickname,
          profileImg: p.profileImg,
          isReady: p.isReady,
          loserTask: p.loserTask,
        })),
        settings: lobby.settings,
      });

      navigate(`/${PageRoutes.LOBBY_ADMIN}`);
    } catch {
      setErrorText('Не удалось создать лобби. Попробуйте ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <LobbyDeck onChangeActiveDeck={setActiveDeckIndex} />
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
        <Button variant="buttonUnderline" onClick={createLobby} disabled={isSubmitting}>
          {isSubmitting ? 'Создаю...' : 'Создать'}
        </Button>
      )}
      {errorText && <Typography>{errorText}</Typography>}
      <img src={lobbyCircle} alt="" className={styles.lobbyCircle} />
    </Container>
  );
};
