import { type FC, useEffect, useRef } from 'react';
import styles from '../style/waitingLobbyStyle.module.scss';
import { Header } from '@widgets/Header';
import { Typography } from '@shared/ui/Typography';
import { LobbyUsersBadge } from '@features/UsersBadge';
import { TextInput } from '@shared/ui/TextInput';
import { Container } from '@shared/ui/Container';
import { ReadyToggle } from '@features/ReadyToggle';
import { useLobbyRealtimeSession } from '@features/LobbyRealtime';
import { useStartGame } from '@features/StartGame';
import { getCurrentUserId } from '@shared/lib/tma/user';
import { useNotify } from '@shared/lib/notify/notify';
import { copyToClipboard } from '@shared/lib/clipboard/copyToClipboard';

const MIN_PLAYERS_TO_START = 3;

function isValidLoserTask(task: string | null | undefined): boolean {
  if (typeof task !== 'string') return false;
  const normalized = task.trim();
  if (!normalized) return false;
  if (normalized.toLowerCase() === 'task') return false;
  return true;
}

/**
 * Экран ожидания игроков в лобби (админ)
 */
export const LobbyAdmin: FC = () => {
  const { user, session, loserTask, readyError, setLoserTask, setReadyError, syncLobbyState } =
    useLobbyRealtimeSession('admin');
  const { notifyError, notifySuccess } = useNotify();
  const { isStarting, startError, startGame } = useStartGame({
    lobbyCode: session?.lobbyCode,
    onSyncLobbyState: syncLobbyState,
  });
  const adminPlayer = session?.players.find((player) => player.id === getCurrentUserId(user));
  const adminReady = Boolean(adminPlayer?.isReady);
  const allPlayersReady = session ? session.players.every((player) => player.isReady) : false;
  const enoughPlayers = session ? session.players.length >= MIN_PLAYERS_TO_START : false;
  const allPlayersHaveTask = session
    ? session.players.every((player) => isValidLoserTask(player.loserTask))
    : false;

  const toggleReady = () => {
    setReadyError(null);
  };

  const isTelegram = Boolean(window.Telegram?.WebApp?.initData);

  const shouldShowClipboardNotify = (): boolean => {
    try {
      // На телефонах с тач-инпутом обычно есть системный toast при копировании.
      // Требование: наш кастомный notify показывать только на компьютере.
      return Boolean(window.matchMedia?.('(pointer: fine)').matches);
    } catch {
      return true;
    }
  };

  const isSharingRef = useRef(false);

  const handleCopyLobbyCode = async () => {
    if (!session?.lobbyCode) return;
    try {
      await copyToClipboard(session.lobbyCode);
      if (shouldShowClipboardNotify()) {
        notifySuccess('Код лобби скопирован в буфер обмена');
      }
    } catch {
      notifyError('Не удалось скопировать код лобби');
    }
  };

  const handleLobbyCodeClick = async () => {
    // 1) Всегда копируем код.
    await handleCopyLobbyCode();
    // 2) Если внутри Telegram — пытаемся поделиться ссылкой.
    if (isTelegram) {
      void handleShareLobby();
    }
  };

  const handleShareLobby = async () => {
    if (!session?.lobbyCode) return;
    if (isSharingRef.current) return;
    isSharingRef.current = true;

    try {
      const telegramBotUrl = import.meta.env.VITE_TELEGRAM_BOT_URL;
      if (
        !telegramBotUrl ||
        telegramBotUrl === 'https://t.me/' ||
        telegramBotUrl === 'https://t.me'
      ) {
        notifyError('Не задана переменная VITE_TELEGRAM_BOT_URL для шаринга');
        return;
      }

      const normalizedBotBase = telegramBotUrl.replace(/\/$/, '');
      const joiner = normalizedBotBase.includes('?') ? '&' : '?';
      // Используем deep-link на бота (внутри Telegram), а payload кладем в `startapp`.
      const lobbyBotLink = `${normalizedBotBase}${joiner}startapp=${encodeURIComponent(
        session.lobbyCode,
      )}`;

      const shareText = 'Присоединиться к лобби';
      const webApp = window.Telegram?.WebApp as any;

      // 1) Telegram deep link (основной способ, работает и на ПК).
      try {
        const openTelegramLink =
          typeof webApp?.openTelegramLink === 'function' ? webApp.openTelegramLink : null;
        if (openTelegramLink) {
          const deepLink = `https://t.me/share/url?url=${encodeURIComponent(
            lobbyBotLink,
          )}&text=${encodeURIComponent(shareText)}`;
          openTelegramLink.call(webApp, deepLink);
          return;
        }
      } catch {
        // ignore and fall through
      }

      // 2) Telegram shareURL (если есть).
      try {
        const shareURL = webApp?.shareURL;
        if (typeof shareURL === 'function') {
          shareURL.call(webApp, lobbyBotLink, shareText);
          return;
        }
      } catch {
        // ignore
      }

      // 4) Фолбэк: копируем ссылку.
      try {
        await copyToClipboard(lobbyBotLink);
        if (shouldShowClipboardNotify()) {
          notifySuccess('Ссылка на лобби скопирована в буфер обмена');
        }
      } catch {
        notifyError('Не удалось скопировать ссылку на лобби');
      }
    } finally {
      isSharingRef.current = false;
    }
  };

  const startBlockReason = !enoughPlayers
    ? 'Недостаточно игроков'
    : !allPlayersReady
      ? 'Не все игроки готовы'
      : !allPlayersHaveTask
        ? 'Нужно задание проигравшему'
        : null;

  useEffect(() => {
    if (!session) return;
    if (session.status === 'started') return;
    if (isStarting) return;
    if (startBlockReason) return;
    startGame();
  }, [isStarting, session, startBlockReason, startGame]);

  if (!session) return null;

  return (
    <Container className={styles.container}>
      <Header className={styles.header} inGame />
      <div className={styles.lobbyBlock}>
        <Typography variant="titleLarge" as="h1" className={styles.lobbyTitle}>
          Лобби
        </Typography>
        <button
          type="button"
          className={styles.lobbyCodeBtn}
          onClick={handleLobbyCodeClick}
          aria-label="Скопировать код лобби"
        >
          <Typography as="span" className={styles.lobbyCode}>
            #{session.lobbyCode}
          </Typography>
        </button>
      </div>
      <div className={styles.playersScroll}>
        <LobbyUsersBadge
          playersClassName={styles.lobbyPlayers}
          players={session.players}
          currentUserId={getCurrentUserId(user)}
        />
      </div>
      <div className={styles.taskBlock}>
        <Typography className={styles.taskLoserText}>Задание проигравшему</Typography>
        <TextInput
          placeholder="Task"
          className={styles.taskLoserWrapper}
          inputClassName={styles.taskLoserInput}
          value={loserTask}
          onChange={(event) => setLoserTask(event.target.value)}
        />
        <Typography className={styles.connectedPlayers}>{session.players.length}/7</Typography>
      </div>
      <Typography className={styles.statusHint}>
        Готовы: {session.players.filter((player) => player.isReady).length}/{session.players.length}
      </Typography>
      {startError ? <Typography className={styles.errorText}>{startError}</Typography> : null}
      {readyError ? <Typography className={styles.errorText}>{readyError}</Typography> : null}
      <div className={styles.actions}>
        <ReadyToggle
          className={styles.readyBtn}
          lobbyCode={session.lobbyCode}
          playerId={adminPlayer?.id ?? getCurrentUserId(user)}
          ready={adminReady}
          loserTask={loserTask}
          fallbackLoserTask={adminPlayer?.loserTask ?? null}
          onValidationError={setReadyError}
          onBeforeToggle={toggleReady}
        />
        <Typography className={styles.statusHint}>
          {startBlockReason ?? (isStarting ? 'Запуск игры...' : 'Игра запускается автоматически')}
        </Typography>
      </div>
    </Container>
  );
};
