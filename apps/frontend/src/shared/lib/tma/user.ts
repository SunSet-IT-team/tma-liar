import { retrieveLaunchParams } from '@tma.js/sdk';
import type { LobbyPlayerPayload } from '../../types/lobby';

const GUEST_USER_STORAGE_KEY = 'guest_tma_user';
const TMA_USER_OVERRIDES_STORAGE_KEY = 'tma_user_overrides';

export type CurrentTmaUser = {
  telegramId: string;
  nickname: string;
  username?: string;
  profileImg?: string;
};

type TmaUserOverrides = {
  profileImg?: string;
  nickname?: string;
  username?: string;
};

function getUserOverrides(telegramId: string): TmaUserOverrides {
  const raw = localStorage.getItem(TMA_USER_OVERRIDES_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, TmaUserOverrides>;
    return parsed?.[telegramId] ?? {};
  } catch {
    return {};
  }
}

export function setTmaUserOverrides(telegramId: string, patch: TmaUserOverrides) {
  const raw = localStorage.getItem(TMA_USER_OVERRIDES_STORAGE_KEY);
  let parsed: Record<string, TmaUserOverrides> = {};

  if (raw) {
    try {
      parsed = JSON.parse(raw) as Record<string, TmaUserOverrides>;
    } catch {
      parsed = {};
    }
  }

  parsed[telegramId] = {
    ...(parsed[telegramId] ?? {}),
    ...patch,
  };

  localStorage.setItem(TMA_USER_OVERRIDES_STORAGE_KEY, JSON.stringify(parsed));
}

export function isGuestUser(user: Pick<CurrentTmaUser, 'telegramId'>): boolean {
  return user.telegramId.startsWith('guest_');
}

function getOrCreateGuestUser(): CurrentTmaUser {
  const raw = localStorage.getItem(GUEST_USER_STORAGE_KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as CurrentTmaUser;
      if (parsed?.telegramId && parsed?.nickname) {
        return parsed;
      }
    } catch {
      // ignore malformed persisted guest user
    }
  }

  const timestamp = Date.now();
  const suffix = String(timestamp).slice(-4);
  const guest: CurrentTmaUser = {
    telegramId: `guest_${timestamp}`,
    nickname: `Guest_${suffix}`,
    profileImg: '',
  };

  localStorage.setItem(GUEST_USER_STORAGE_KEY, JSON.stringify(guest));
  return guest;
}

export function getCurrentTmaUser(): CurrentTmaUser {
  try {
    const user = retrieveLaunchParams().tgWebAppData?.user;

    if (!user?.id) {
      throw new Error('TMA_USER_NOT_FOUND');
    }

    const fallbackNickname = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();

    const overrides = getUserOverrides(String(user.id));
    const baseNickname = user.username ?? fallbackNickname ?? `user_${user.id}`;

    return {
      telegramId: String(user.id),
      nickname: overrides.nickname ?? baseNickname,
      username: overrides.username ?? user.username,
      profileImg: overrides.profileImg ?? user.photo_url,
    };
  } catch {
    return getOrCreateGuestUser();
  }
}

export function toLobbyPlayerPayload(user: CurrentTmaUser, loserTask = 'task'): LobbyPlayerPayload {
  return {
    id: user.telegramId,
    telegramId: user.telegramId,
    nickname: user.nickname,
    profileImg: user.profileImg,
    score: 0,
    isReady: false,
    inGame: false,
    loserTask,
    wasLiar: 0,
    answer: null,
    likes: 0,
    isConfirmed: false,
  };
}
