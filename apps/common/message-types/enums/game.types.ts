/**
 * Список игровых событий в enum-форме.
 * Используется в backend-слое (socket handlers/services).
 */
export enum GameMessageTypes {
    /** Подписка сокета на комнату игры. */
    GAME_SUBSCRIBE = "game:subscribe",

    /** Полное состояние игры для подключившегося сокета. */
    GAME_STATE = "game:state",

    /** Лжец сделал выбор (врать/не врать). */
    LIAR_CHOSE = "game:liar:chose",

    /** Игрок (решала) отправил голос: верю или не верю. */
    PLAYER_VOTED = "game:player:voted",

    /** Игрок зафиксировал свой выбор. */
    PLAYER_SECURED = "game:player:secured",

    /** Игрок поставил лайк другому игроку. */
    PLAYER_LIKED = "game:player:liked",

    /** В игре поменялась стадия. */
    STAGE_CHANGED = "game:stage:changed",

    /** Админ запустил игру из лобби. */
    GAME_STARTED = "game:started",
}
