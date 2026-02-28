import type { LobbySettings, LobbyStateView } from '../../types/lobby';

const LOBBY_SESSION_KEY = 'lobby_session';

export type LobbySession = {
  lobbyCode: string;
  adminId: string;
  status: string;
  players: LobbyStateView['players'];
  settings: LobbySettings;
};

export const lobbySessionService = {
  get(): LobbySession | null {
    const raw = localStorage.getItem(LOBBY_SESSION_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as LobbySession;
    } catch {
      return null;
    }
  },

  set(session: LobbySession) {
    localStorage.setItem(LOBBY_SESSION_KEY, JSON.stringify(session));
  },

  patch(patch: Partial<LobbySession>) {
    const current = this.get();
    if (!current) return;
    this.set({ ...current, ...patch });
  },

  clear() {
    localStorage.removeItem(LOBBY_SESSION_KEY);
  },
};
