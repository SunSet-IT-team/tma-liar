import { apiClient } from '../api/client';
import type { ApiEnvelope, LobbyState, LobbyStateView } from '../../types/lobby';

export async function createLobbyRequest(payload: {
  settings: LobbyState['settings'];
  nickname?: string;
  profileImg?: string;
  loserTask?: string;
}) {
  const response = await apiClient.post<ApiEnvelope<LobbyState>>('/api/lobbies', payload);
  return response.data.payload;
}

export async function findLobbyRequest(lobbyCode: string) {
  const response = await apiClient.get<ApiEnvelope<LobbyState>>(`/api/lobbies/${lobbyCode}`);
  return response.data.payload;
}

export async function findLobbyViewRequest(lobbyCode: string) {
  const response = await apiClient.get<ApiEnvelope<LobbyStateView>>(`/api/lobbies/${lobbyCode}`);
  return response.data.payload;
}

export async function updateLobbyRequest(payload: {
  lobbyCode: string;
  currentGameId?: string | null;
  status?: 'waiting' | 'started' | 'finished';
}) {
  const response = await apiClient.put<ApiEnvelope<LobbyState>>('/api/lobbies', payload);
  return response.data.payload;
}
