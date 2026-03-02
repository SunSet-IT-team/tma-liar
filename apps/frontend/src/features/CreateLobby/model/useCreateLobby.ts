import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '@app/routes/pages';
import { getCurrentTmaUser, isGuestUser } from '@shared/lib/tma/user';
import { createLobbyRequest } from '@shared/services/lobby/lobby.api';
import { lobbySessionService } from '@shared/services/lobby/lobby-session.service';
import type { LobbyDeck as BackendLobbyDeck } from '@shared/types/lobby';
import type { Deck } from '@shared/types/deck';
import {
  confirmDeckPurchaseRequest,
  createDeckPurchaseRequest,
  fetchDecksRequest,
} from '@shared/services/api/decks.api';

const PENDING_DECK_PURCHASE_KEY = 'pending_deck_purchase';

function mapDeckToBackendDeck(deck: Deck, deckIndex: number): BackendLobbyDeck {
  return {
    name: deck.name,
    questionsCount: deck.questionsCount,
    cover: deck.cover ?? '/icons/blackPhoto.svg',
    questions: deck.questions.map((question, index) => ({
      id: question.id || `deck-${deckIndex + 1}-q-${index + 1}`,
      type: question.type || 'general',
      content: question.content,
      complexity: question.complexity ?? 1,
    })),
  };
}

export function useCreateLobby() {
  const navigate = useNavigate();
  const [questionCount, setQuestionCount] = useState<number>(30);
  const [answerTime, setAnswerTime] = useState<number>(20);
  const [activeDeckIndex, setActiveDeckIndex] = useState<number>(0);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isDecksLoading, setIsDecksLoading] = useState(false);
  const [isBuyingDeck, setIsBuyingDeck] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const user = getCurrentTmaUser();
  const isGuest = isGuestUser(user);
  const telegramBotUrl = import.meta.env.VITE_TELEGRAM_BOT_URL ?? 'https://t.me/';
  const selectedDeck = decks[activeDeckIndex] ?? null;

  const isSelectedDeckLocked = useMemo(
    () => Boolean(selectedDeck?.isPaid && !selectedDeck?.isPurchased),
    [selectedDeck],
  );

  useEffect(() => {
    let isMounted = true;

    const loadDecks = async () => {
      setIsDecksLoading(true);
      try {
        const fetchedDecks = await fetchDecksRequest();
        if (!isMounted) return;
        setDecks(fetchedDecks);
      } catch {
        if (!isMounted) return;
        setErrorText('Не удалось загрузить список колод');
      } finally {
        if (isMounted) {
          setIsDecksLoading(false);
        }
      }
    };

    void loadDecks();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const pendingRaw = sessionStorage.getItem(PENDING_DECK_PURCHASE_KEY);
    if (!pendingRaw) {
      return;
    }

    let pending: { deckId: string; paymentId: string } | null = null;
    try {
      pending = JSON.parse(pendingRaw) as { deckId: string; paymentId: string } | null;
    } catch {
      pending = null;
    }

    if (!pending?.deckId || !pending?.paymentId) {
      sessionStorage.removeItem(PENDING_DECK_PURCHASE_KEY);
      return;
    }

    let isMounted = true;
    setErrorText(null);

    const confirm = async () => {
      try {
        const result = await confirmDeckPurchaseRequest(pending.deckId, pending.paymentId);
        if (!isMounted) return;

        if (!result.purchased) {
          setErrorText('Оплата не подтверждена');
          return;
        }

        const fetchedDecks = await fetchDecksRequest();
        if (!isMounted) return;

        setDecks(fetchedDecks);
        setErrorText(null);
      } catch {
        if (!isMounted) return;
        setErrorText('Не удалось подтвердить оплату колоды');
      } finally {
        sessionStorage.removeItem(PENDING_DECK_PURCHASE_KEY);
      }
    };

    void confirm();

    return () => {
      isMounted = false;
    };
  }, []);

  const createLobby = async () => {
    if (isSubmitting) return;

    if (isGuest) {
      setErrorText('Создание лобби доступно только при входе через Telegram.');
      return;
    }

    if (!selectedDeck) {
      setErrorText('Выберите колоду');
      return;
    }

    if (isSelectedDeckLocked) {
      setErrorText('Эта колода платная. Сначала купите её');
      return;
    }

    setIsSubmitting(true);
    setErrorText(null);

    try {
      const selectedBackendDeck = mapDeckToBackendDeck(selectedDeck, activeDeckIndex);
      const normalizedQuestionCount = Math.min(questionCount, selectedBackendDeck.questions.length);

      const lobby = await createLobbyRequest({
        settings: {
          deckId: selectedDeck.id,
          questionCount: normalizedQuestionCount,
          answerTime,
          deck: selectedBackendDeck,
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

  const buySelectedDeck = async () => {
    if (!selectedDeck || !selectedDeck.isPaid || selectedDeck.isPurchased || isBuyingDeck) {
      return;
    }

    setIsBuyingDeck(true);
    setErrorText(null);

    try {
      const result = await createDeckPurchaseRequest(selectedDeck.id);
      if (result.alreadyPurchased) {
        const fetchedDecks = await fetchDecksRequest();
        setDecks(fetchedDecks);
        return;
      }

      sessionStorage.setItem(
        PENDING_DECK_PURCHASE_KEY,
        JSON.stringify({ deckId: selectedDeck.id, paymentId: result.paymentId }),
      );
      window.location.href = result.confirmationUrl;
    } catch {
      setErrorText('Не удалось создать оплату для колоды');
    } finally {
      setIsBuyingDeck(false);
    }
  };

  return {
    questionCount,
    answerTime,
    activeDeckIndex,
    selectedDeck,
    decks,
    isDecksLoading,
    isBuyingDeck,
    isSubmitting,
    errorText,
    isGuest,
    telegramBotUrl,
    isSelectedDeckLocked,
    setQuestionCount,
    setAnswerTime,
    setActiveDeckIndex,
    createLobby,
    buySelectedDeck,
  };
}
