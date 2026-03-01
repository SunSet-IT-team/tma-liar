import type { FC } from 'react';
import { LobbySocketEvents } from '@common/message-types/events/lobby.events';
import { getLobbySocket } from '@shared/services/socket/lobby.socket';
import { Button } from '../../../shared/ui/Button';

type ReadyToggleProps = {
  lobbyCode: string;
  playerId: string;
  ready: boolean;
  loserTask?: string | null;
  fallbackLoserTask?: string | null;
  requireTask?: boolean;
  onValidationError?: (message: string) => void;
  onBeforeToggle?: () => void;
  className?: string;
  disabled?: boolean;
  readyText?: string;
  notReadyText?: string;
};

function isValidLoserTask(task: string | null | undefined): boolean {
  if (typeof task !== 'string') return false;
  const normalized = task.trim();
  if (!normalized) return false;
  if (normalized.toLowerCase() === 'task') return false;
  return true;
}

/**
 * Кнопка переключения готовности игрока в лобби.
 */
export const ReadyToggle: FC<ReadyToggleProps> = ({
  lobbyCode,
  playerId,
  ready,
  loserTask,
  fallbackLoserTask,
  requireTask = true,
  onValidationError,
  onBeforeToggle,
  className,
  disabled,
  readyText = 'Я не готов',
  notReadyText = 'Я готов',
}) => {
  const toggleReady = () => {
    const normalizedTask = loserTask?.trim() ?? '';
    if (!ready && requireTask && !isValidLoserTask(normalizedTask)) {
      onValidationError?.('Сначала придумайте задание проигравшему.');
      return;
    }

    onBeforeToggle?.();

    const socket = getLobbySocket();
    socket.emit(LobbySocketEvents.PLAYER_READY, {
      lobbyCode,
      playerId,
      loserTask: normalizedTask || fallbackLoserTask || null,
    });
  };

  return (
    <Button className={className} onClick={toggleReady} disabled={disabled}>
      {ready ? readyText : notReadyText}
    </Button>
  );
};
