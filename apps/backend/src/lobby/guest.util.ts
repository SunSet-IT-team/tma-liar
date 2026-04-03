import { LobbyStatus } from './entities/lobby.entity';

/**
 * Гости на клиенте имеют telegramId вида `guest_<timestamp>`; id может совпадать с telegramId.
 */
export function isGuestPlayer(player: { id?: string | null; telegramId?: string | null }): boolean {
  const tid = typeof player.telegramId === 'string' ? player.telegramId : '';
  const id = typeof player.id === 'string' ? player.id : '';
  return tid.startsWith('guest_') || id.startsWith('guest_');
}

export function countNonGuestPlayers(
  players: Array<{ id?: string | null; telegramId?: string | null }>,
): number {
  return players.filter((p) => !isGuestPlayer(p)).length;
}

export type LeavePlanAfterRemove =
  | { kind: 'delete' }
  | { kind: 'keep' }
  | { kind: 'transfer'; nextAdminId: string };

/**
 * Правила после удаления вышедшего игрока из списка: гости не считаются пригодными для продолжения лобби
 * и не могут получить админку.
 */
export function planLeaveAfterPlayerRemoved(
  lobbySnap: { status: string; currentGameId: string | null },
  updatedPlayers: Array<{ id?: string | null; telegramId?: string | null }>,
  isAdmin: boolean,
): LeavePlanAfterRemove {
  if (countNonGuestPlayers(updatedPlayers) === 0) {
    return { kind: 'delete' };
  }
  if (!isAdmin) {
    return { kind: 'keep' };
  }
  if (lobbySnap.status === LobbyStatus.STARTED && lobbySnap.currentGameId) {
    const nextNonGuest = updatedPlayers.find((p) => !isGuestPlayer(p));
    if (!nextNonGuest) {
      return { kind: 'delete' };
    }
    const nextAdminId = nextNonGuest.id ?? nextNonGuest.telegramId;
    if (!nextAdminId) {
      return { kind: 'delete' };
    }
    return { kind: 'transfer', nextAdminId };
  }
  return { kind: 'delete' };
}
