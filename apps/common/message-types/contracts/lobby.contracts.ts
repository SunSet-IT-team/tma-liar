/**
 * Базовое представление игрока в лобби, передаваемое по сокету.
 */
export type LobbyPlayerPayload = {
  /** Идентификатор игрока (в проекте совпадает с telegramId). */
  id: string;
  /** Никнейм игрока для отображения в UI. */
  nickname: string;
  /** URL или путь к аватару игрока. */
  profileImg?: string;
  /** Флаг готовности игрока к старту игры. */
  isReady?: boolean;
  /** Флаг участия в текущей активной игре в рамках лобби. */
  inGame?: boolean;
  /** Задание проигравшему, которое задал конкретный игрок. */
  loserTask?: string | null;
};

/**
 * Допустимые статусы лобби в протоколе.
 */
export const LobbyStatusValues = ['waiting', 'started', 'finished'] as const;

/**
 * Статус лобби.
 */
export type LobbyStatus = (typeof LobbyStatusValues)[number];

/**
 * Полный снимок состояния лобби.
 * Обычно возвращается при подписке на комнату лобби.
 */
export type LobbyStatePayload = {
  /** Короткий код комнаты (например, `ABC123`). */
  lobbyCode: string;
  /** Идентификатор текущего админа лобби. */
  adminId: string;
  /** Идентификатор активной игры в лобби, если игра запущена. */
  currentGameId?: string | null;
  /** Статус лобби (`waiting`, `started`, `finished`). */
  status: LobbyStatus;
  /** Актуальный список игроков в лобби. */
  players: LobbyPlayerPayload[];
};

/**
 * Payload события входа игрока в лобби.
 */
export type JoinLobbySocketPayload = {
  /** Код лобби, в которое нужно подключиться. */
  lobbyCode: string;
  /** Никнейм (опционально, может быть взят сервером из профиля). */
  nickname?: string;
  /** Аватар (опционально, может быть взят сервером из профиля). */
  profileImg?: string;
  /** Начальное задание проигравшему от игрока. */
  loserTask?: string;
};

/**
 * Универсальный payload, когда нужен только код лобби.
 */
export type LobbyCodePayload = {
  /** Код лобби. */
  lobbyCode: string;
};

/**
 * Payload переключения готовности игрока в лобби.
 */
export type ToggleReadySocketPayload = {
  /** Код лобби. */
  lobbyCode: string;
  /** ID игрока (если не передан, сервер может взять из авторизованного сокета). */
  playerId?: string;
  /** Текущее задание игрока (для сохранения/обновления перед готовностью). */
  loserTask?: string | null;
};

/**
 * Частичное обновление игрока в lobby-diff сообщении.
 */
export type LobbyDiffPlayerPayload = Partial<LobbyPlayerPayload> & {
  /** ID игрока, к которому относится изменение. */
  id?: string;
  /** Флаг удаления игрока из списка (выход/исключение). */
  _removed?: boolean;
};

/**
 * Частичное обновление состояния лобби.
 * Приходит в `status changed` событиях вместо полного снимка.
 */
export type LobbyDiffPayload = {
  /** Измененный код лобби (практически всегда неизменен, но поле поддерживается). */
  lobbyCode?: string;
  /** Новый админ лобби. */
  adminId?: string;
  /** Новый active game id или `null` при завершении/сбросе. */
  currentGameId?: string | null;
  /** Новый статус лобби. */
  status?: LobbyStatus;
  /** Частичные изменения по игрокам. */
  players?: LobbyDiffPlayerPayload[];
  /** Текущая стадия игры, если сервер шлет связанное обновление. */
  stage?: string;
};

/**
 * Обертка системного события `changeGameStatus` для лобби-изменений.
 */
export type LobbyStatusChangedPayload = {
  /** Строковый маркер типа изменения (например `lobby:player:ready`). */
  status?: string;
  /** Дифф по лобби. */
  diff?: LobbyDiffPayload;
  /** Текущая игровая стадия (если применимо). */
  stage?: string;
};
