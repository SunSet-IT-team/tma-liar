import { type FC, useRef } from 'react';
import styles from '../style/waitingLobbyStyle.module.scss';
import { Header } from '@widgets/Header';
import { Typography } from '@shared/ui/Typography';
import { LobbyUsersBadge } from '@features/UsersBadge';
import { TextInput } from '@shared/ui/TextInput';
import { Container } from '@shared/ui/Container';
import { ReadyToggle } from '@features/ReadyToggle';
import { useLobbyRealtimeSession } from '@features/LobbyRealtime';
import { getCurrentUserId } from '@shared/lib/tma/user';
import { useNotify } from '@shared/lib/notify/notify';
import { copyToClipboard } from '@shared/lib/clipboard/copyToClipboard';

/**
 * Экран ожидания игроков в лобби (игрок)
 */
export const LobbyPlayer: FC = () => {
  const { user, session, ready, loserTask, readyError, setLoserTask, setReadyError } =
    useLobbyRealtimeSession('player');
  const { notifyError, notifySuccess } = useNotify();

  const isTelegram = Boolean(window.Telegram?.WebApp?.initData);

  const isSharingRef = useRef(false);

  const shouldShowClipboardNotify = (): boolean => {
    try {
      return Boolean(window.matchMedia?.('(pointer: fine)').matches);
    } catch {
      return true;
    }
  };

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
    await handleCopyLobbyCode();
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
      // Deep-link на бота внутри Telegram. Payload кладем в `startapp`.
      const lobbyBotLink = `${normalizedBotBase}${joiner}startapp=${encodeURIComponent(session.lobbyCode)}`;

      const shareText = 'Присоединиться к лобби';
      const webApp = window.Telegram?.WebApp as any;

      // 1) Telegram deep link: стандартный шаринг внутри Telegram (работает на ПК тоже).
      try {
        const openTelegramLink =
          typeof webApp?.openTelegramLink === 'function' ? webApp.openTelegramLink : null;
        if (openTelegramLink) {
          const deepLink = `https://t.me/share/url?url=${encodeURIComponent(lobbyBotLink)}&text=${encodeURIComponent(
            shareText,
          )}`;
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

      // 4) Если ничего не сработало — копируем ссылку.
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
          value={loserTask}
          onChange={(event) => setLoserTask(event.target.value)}
          className={styles.taskLoserWrapper}
          inputClassName={styles.taskLoserInput}
        />
      </div>
      <Typography className={styles.statusHint}>
        Готовы: {session.players.filter((player) => player.isReady).length}/{session.players.length}
      </Typography>
      {readyError ? <Typography className={styles.errorText}>{readyError}</Typography> : null}
      <div className={styles.actions}>
        <ReadyToggle
          className={styles.readyBtn}
          lobbyCode={session.lobbyCode}
          playerId={getCurrentUserId(user)}
          ready={ready}
          loserTask={loserTask}
          fallbackLoserTask={
            session.players.find((player) => player.id === getCurrentUserId(user))?.loserTask ??
            null
          }
          onValidationError={setReadyError}
          onBeforeToggle={() => setReadyError(null)}
        />
      </div>
    </Container>
  );
};
