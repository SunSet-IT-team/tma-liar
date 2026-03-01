import type { LobbyPlayerPayload } from './lobby.contracts';

/**
 * Представление игрока в игровом контексте.
 * Расширяет базовые поля лобби значениями конкретного раунда/матча.
 */
export type GamePlayerPayload = LobbyPlayerPayload & {
  /** Ответ решалы: `1` — верю, `0` — не верю, `null`/`undefined` — не выбрал. */
  answer?: number | null;
  /** Количество лайков, полученных игроком в текущей игре/раунде. */
  likes?: number;
  /** Признак, что игрок зафиксировал действие на текущем этапе. */
  isConfirmed?: boolean | null;
  /** Текущие очки игрока. */
  score?: number;
};

/**
 * Полный снимок состояния игры.
 * Используется при подписке на игровую комнату и при первичной синхронизации клиента.
 */
export type GameStatePayload = {
  /** Идентификатор игры. */
  gameId: string;
  /** Текущая стадия игры (`liar_chooses`, `question_to_liar` и т.д.). */
  stage?: string;
  /** Timestamp начала стадии (ms). */
  stageStartedAt?: number;
  /** Продолжительность текущей стадии (ms). */
  stageDurationMs?: number | null;
  /** ID текущего лжеца. */
  liarId?: string | null;
  /** ID активного вопроса из колоды. */
  activeQuestion?: string | null;
  /** Текст активного вопроса. */
  activeQuestionText?: string | null;
  /** ID победителя (после завершения игры). */
  winnerId?: string | null;
  /** ID проигравшего (после завершения игры). */
  loserId?: string | null;
  /** Задание для проигравшего (берется от победителя). */
  loserTask?: string | null;
  /** Игроки и их игровое состояние. */
  players?: GamePlayerPayload[];
};

/**
 * Payload подписки на игровую комнату.
 */
export type GameSubscribeSocketPayload = {
  /** Идентификатор игры, к комнате которой подключается сокет. */
  gameId: string;
};

/**
 * Payload выбора лжеца (будет врать или нет).
 */
export type LiarChoseSocketPayload = {
  /** Идентификатор игры. */
  gameId: string;
  /** ID игрока-лжеца, отправившего действие. */
  playerId: string;
  /** `true` — будет врать, `false` — будет говорить правду. */
  answer: boolean;
};

/**
 * Payload голоса решалы.
 */
export type PlayerVotedSocketPayload = {
  /** Идентификатор игры. */
  gameId: string;
  /** ID игрока, который голосует. */
  playerId: string;
  /** Вариант ответа: `1` — верю, `0` — не верю. */
  answer: number;
};

/**
 * Payload фиксации выбранного ответа игроком.
 */
export type PlayerSecuredSocketPayload = {
  /** Идентификатор игры. */
  gameId: string;
  /** ID игрока, фиксирующего ответ. */
  playerId: string;
};

/**
 * Payload постановки лайка другому игроку.
 */
export type PlayerLikedSocketPayload = {
  /** Идентификатор игры. */
  gameId: string;
  /** ID игрока, поставившего лайк. */
  senderId: string;
  /** ID игрока, которому поставлен лайк. */
  receiverId: string;
};

/**
 * Частичный дифф игрового состояния.
 * Приходит в системных `status changed` событиях между полными снимками.
 */
export type GameStatusDiffPayload = {
  /** Код лобби, связанного с игрой. */
  lobbyCode?: string;
  /** ID админа лобби. */
  adminId?: string;
  /** Активный gameId в лобби. */
  currentGameId?: string | null;
  /** Статус лобби. */
  status?: string;
  /** Текущая стадия игры. */
  stage?: string;
  /** ID активного вопроса. */
  activeQuestion?: string | null;
  /** ID победителя. */
  winnerId?: string | null;
  /** ID проигравшего. */
  loserId?: string | null;
  /** Текущее задание проигравшему. */
  loserTask?: string | null;
  /** Частичные изменения игроков. */
  players?: Array<Partial<GamePlayerPayload> & { id?: string; _removed?: boolean }>;
};

/**
 * Универсальный payload системного события `changeGameStatus` для игровой фазы.
 * Может содержать как полный набор полей игры, так и частичный `diff`.
 */
export type GameStatusChangedPayload = Partial<GameStatePayload> & {
  /** Маркер типа изменения (например `game:player:voted`). */
  status?: string;
  /** Частичный дифф состояния игры/лобби. */
  diff?: GameStatusDiffPayload;
};
