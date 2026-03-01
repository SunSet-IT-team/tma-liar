import type { LobbySession } from './lobby-session.service';

type LobbyDiffPlayer = {
  id?: string;
  nickname?: string;
  profileImg?: string;
  _removed?: boolean;
  isReady?: boolean;
  inGame?: boolean;
  loserTask?: string | null;
};

type LobbyDiff = {
  lobbyCode?: string;
  adminId?: string;
  currentGameId?: string | null;
  status?: string;
  players?: LobbyDiffPlayer[];
  stage?: string;
};

export type ChangeGameStatusPayload = {
  status?: string;
  diff?: LobbyDiff;
  stage?: string;
};

export function applyLobbyDiff(session: LobbySession, payload: ChangeGameStatusPayload): LobbySession {
  if (typeof payload.status === 'string' && !payload.status.startsWith('lobby:')) {
    return session;
  }

  const diff = payload.diff;
  if (!diff) return session;
  const hasCurrentGameId = Object.prototype.hasOwnProperty.call(diff, 'currentGameId');
  const hasStatus = Object.prototype.hasOwnProperty.call(diff, 'status');
  const hasLobbyCode = Object.prototype.hasOwnProperty.call(diff, 'lobbyCode');
  const hasAdminId = Object.prototype.hasOwnProperty.call(diff, 'adminId');

  const nextPlayers = [...session.players];

  if (Array.isArray(diff.players)) {
    for (const player of diff.players) {
      const playerId = player.id;
      if (!playerId) continue;

      const index = nextPlayers.findIndex((item) => item.id === playerId);

      if (player._removed) {
        if (index !== -1) {
          nextPlayers.splice(index, 1);
        }
        continue;
      }

      const nextPlayer = {
        id: playerId,
        nickname:
          player.nickname ??
          (index !== -1 ? nextPlayers[index]?.nickname : undefined) ??
          `Игрок ${playerId.slice(-4)}`,
        profileImg: player.profileImg ?? (index !== -1 ? nextPlayers[index]?.profileImg : undefined),
        isReady: player.isReady ?? (index !== -1 ? nextPlayers[index]?.isReady : false),
        inGame: player.inGame ?? (index !== -1 ? nextPlayers[index]?.inGame : false),
        loserTask: player.loserTask ?? (index !== -1 ? nextPlayers[index]?.loserTask : null),
      };

      if (index === -1) {
        nextPlayers.push(nextPlayer);
      } else {
        nextPlayers[index] = nextPlayer;
      }
    }
  }

  return {
    ...session,
    lobbyCode: hasLobbyCode ? (diff.lobbyCode ?? session.lobbyCode) : session.lobbyCode,
    adminId: hasAdminId ? (diff.adminId ?? session.adminId) : session.adminId,
    currentGameId: hasCurrentGameId ? (diff.currentGameId ?? null) : session.currentGameId,
    status: hasStatus ? (diff.status ?? session.status) : session.status,
    currentStage: payload.stage ?? diff.stage ?? session.currentStage ?? null,
    players: nextPlayers,
  };
}

export function getStageFromPayload(payload: ChangeGameStatusPayload): string | null {
  return payload.stage ?? payload.diff?.stage ?? null;
}

export function getCurrentPlayerReady(payload: ChangeGameStatusPayload, userId: string): boolean | null {
  const players = payload.diff?.players;
  if (!players) return null;

  const current = players.find((player) => player.id === userId);
  if (!current) return null;
  if (typeof current.isReady !== 'boolean') return null;

  return current.isReady;
}
