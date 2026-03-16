import type { SocketErrorPayload } from '@liar/message-types';

const SOCKET_ERROR_MESSAGES: Record<string, string> = {
  WRONG_STAGE: 'Действие недоступно на текущем этапе игры.',
  GAME_NOT_FOUND: 'Игра не найдена. Обновите страницу.',
  PLAYER_ACTION_FORBIDDEN: 'Нельзя выполнять действие за другого игрока.',
  LIAR_CHOOSE_FORBIDDEN: 'Только текущий лжец может выбрать ответ.',
  LIAR_CANNOT_VOTE: 'Лжец не может голосовать в этом раунде.',
  LIAR_CANNOT_SECURE: 'Лжец не может фиксировать ответ в этом раунде.',
  PLAYER_DIDNT_ANSWER: 'Сначала выберите вариант: верю или не верю.',
  ANSWER_ALREADY_CONFIRMED: 'Ответ уже зафиксирован.',
  LIKE_ALREADY_SENT: 'Вы уже поставили лайк этому игроку в текущем раунде.',
  RECEIVER_EQUALS_SENDER_IDS: 'Нельзя поставить лайк самому себе.',
  RECEIVER_EQUALS_LIAR_IDS: 'Нельзя поставить лайк лжецу.',
  SENDER_DIDNT_ANSWER: 'Сначала зафиксируйте свой ответ.',
};

export function toUserSocketError(
  error: SocketErrorPayload | null | undefined,
  fallback: string,
): string {
  const code = error?.errorCode ?? error?.message ?? '';
  if (!code) return fallback;
  return SOCKET_ERROR_MESSAGES[code] ?? `${fallback} (${code}).`;
}
