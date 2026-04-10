import { apiClient } from './client';
import type {
  Deck,
  DeckPurchaseConfirmResponse,
  DeckPurchaseCreateResponse,
  DeckPurchaseWithBalanceResponse,
} from '../../types/deck';

type ApiEnvelope<T> = {
  status: 'success' | 'error';
  payload: T;
};

type DeckWithMeta = Deck & {
  updatedAt?: string;
  createdAt?: string;
};

function resolveDeckCoverUrl(cover: string, versionSeed?: string): string {
  if (!cover) return cover;
  const appendVersion = (url: string) =>
    versionSeed ? `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(versionSeed)}` : url;

  if (cover.startsWith('data:')) {
    return cover;
  }

  if (cover.startsWith('http://') || cover.startsWith('https://')) {
    return appendVersion(cover);
  }

  if (cover.startsWith('/')) {
    return appendVersion(cover);
  }

  return appendVersion(cover);
}

export async function fetchDecksRequest() {
  const response = await apiClient.get<ApiEnvelope<DeckWithMeta[]>>('/api/decks');
  return response.data.payload.map((deck) => {
    const versionSeed = deck.updatedAt ?? deck.createdAt ?? deck.id;
    return {
      ...deck,
      cover: resolveDeckCoverUrl(deck.cover, versionSeed),
    };
  });
}

export async function createDeckPurchaseRequest(deckId: string) {
  const response = await apiClient.post<ApiEnvelope<DeckPurchaseCreateResponse>>(`/api/decks/${deckId}/purchase`);
  return response.data.payload;
}

export async function confirmDeckPurchaseRequest(deckId: string, paymentId: string) {
  const response = await apiClient.post<ApiEnvelope<DeckPurchaseConfirmResponse>>(
    `/api/decks/${deckId}/purchase/confirm`,
    { paymentId },
  );
  return response.data.payload;
}

export async function purchaseDeckWithBalanceRequest(deckId: string) {
  const response = await apiClient.post<ApiEnvelope<DeckPurchaseWithBalanceResponse>>(
    `/api/decks/${deckId}/purchase/balance`,
  );
  return response.data.payload;
}
