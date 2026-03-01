import { retrieveLaunchParams } from '@tma.js/sdk';
import type { LobbyPlayerPayload } from '../../types/lobby';

const GUEST_USER_STORAGE_KEY = 'guest_tma_user';

export type CurrentTmaUser = {
  telegramId: string;
  nickname: string;
  username?: string;
  profileImg?: string;
};

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

    return {
      telegramId: String(user.id),
      nickname: user.username ?? fallbackNickname ?? `user_${user.id}`,
      username: user.username,
      profileImg: user.photo_url,
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
