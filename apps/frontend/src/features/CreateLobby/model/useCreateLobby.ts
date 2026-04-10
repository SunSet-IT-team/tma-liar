import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '@app/routes/pages';
import { getCurrentUser, isGuestUser } from '@shared/lib/tma/user';
import { createLobbyRequest } from '@shared/services/lobby/lobby.api';
import { lobbySessionService } from '@shared/services/lobby/lobby-session.service';
import type { LobbyDeck as BackendLobbyDeck } from '@shared/types/lobby';
import type { Deck } from '@shared/types/deck';
import {
  confirmDeckPurchaseRequest,
  createDeckPurchaseRequest,
  fetchDecksRequest,
  purchaseDeckWithBalanceRequest,
} from '@shared/services/api/decks.api';
import { getMe } from '@shared/services/api/user.api';
import { useNotify } from '@shared/lib/notify/notify';

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
  const { notifyError } = useNotify();
  const [questionCount, setQuestionCount] = useState<number>(30);
  const [answerTime, setAnswerTime] = useState<number>(20);
  const [activeDeckIndex, setActiveDeckIndex] = useState<number>(0);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isDecksLoading, setIsDecksLoading] = useState(false);
  const [isBuyingDeck, setIsBuyingDeck] = useState(false);
  const [isBuyingDeckWithBalance, setIsBuyingDeckWithBalance] = useState(false);
  const [balanceRub, setBalanceRub] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = getCurrentUser();
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
      if (isGuest) return; // Гость не может создать лобби

      setIsDecksLoading(true);
      try {
        const fetchedDecks = await fetchDecksRequest();
        if (!isMounted) return;
        setDecks(fetchedDecks);
      } catch {
        if (!isMounted) return;
        notifyError('Не удалось загрузить список колод. Проверьте подключение и попробуйте ещё раз.');
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
  }, [isGuest, notifyError]);

  useEffect(() => {
    if (isGuest) {
      setBalanceRub(null);
      return;
    }
    void getMe().then((u) => {
      if (u) setBalanceRub(u.balanceRub);
    });
  }, [isGuest]);

  useEffect(() => {
    if(isGuest ) return; // Гость не может создать лобби
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

    const confirm = async () => {
      try {
        const result = await confirmDeckPurchaseRequest(pending.deckId, pending.paymentId);
        if (!isMounted) return;

        if (!result.purchased) {
          notifyError('Оплата не подтверждена');
          return;
        }

        const fetchedDecks = await fetchDecksRequest();
        if (!isMounted) return;

        setDecks(fetchedDecks);
      } catch {
        if (!isMounted) return;
        notifyError('Не удалось подтвердить оплату колоды. Попробуйте ещё раз.');
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
      notifyError('Создание лобби доступно только при входе через Telegram.');
      return;
    }

    if (!selectedDeck) {
      notifyError('Выберите колоду');
      return;
    }

    if (isSelectedDeckLocked) {
      notifyError('Эта колода платная. Сначала купите её');
      return;
    }

    setIsSubmitting(true);

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
      notifyError('Не удалось создать лобби. Попробуйте ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const buySelectedDeck = async () => {
    if (!selectedDeck || !selectedDeck.isPaid || selectedDeck.isPurchased || isBuyingDeck) {
      return;
    }

    setIsBuyingDeck(true);

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
      notifyError('Не удалось создать оплату для колоды');
    } finally {
      setIsBuyingDeck(false);
    }
  };

  const buySelectedDeckWithBalance = async () => {
    if (!selectedDeck || !selectedDeck.isPaid || selectedDeck.isPurchased || isBuyingDeckWithBalance) {
      return;
    }

    const price = Math.max(0, Math.round(selectedDeck.priceRub ?? 0));
    if (balanceRub !== null && balanceRub < price) {
      notifyError('Недостаточно средств на балансе');
      return;
    }

    setIsBuyingDeckWithBalance(true);

    try {
      const result = await purchaseDeckWithBalanceRequest(selectedDeck.id);
      setBalanceRub(result.balanceRub);
      const fetchedDecks = await fetchDecksRequest();
      setDecks(fetchedDecks);
    } catch (error) {
      const status = (error as { response?: { status?: number; data?: { errorCode?: string } } })
        .response?.status;
      const code = (error as { response?: { data?: { errorCode?: string } } }).response?.data
        ?.errorCode;
      if (status === 402 || code === 'INSUFFICIENT_BALANCE') {
        notifyError('Недостаточно средств на балансе');
        void getMe().then((u) => {
          if (u) setBalanceRub(u.balanceRub);
        });
        return;
      }
      notifyError('Не удалось купить колоду с баланса');
    } finally {
      setIsBuyingDeckWithBalance(false);
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
    isBuyingDeckWithBalance,
    balanceRub,
    isSubmitting,
    isGuest,
    telegramBotUrl,
    isSelectedDeckLocked,
    setQuestionCount,
    setAnswerTime,
    setActiveDeckIndex,
    createLobby,
    buySelectedDeck,
    buySelectedDeckWithBalance,
  };
}
