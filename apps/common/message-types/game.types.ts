/**
 * Типы сообщения для Game
 */
export enum GameMessageTypes { 
    /** Подписка на комнату игры */
    GAME_SUBSCRIBE = "game:subscribe",

    /** Актуальное состояние игры для подключившегося сокета */
    GAME_STATE = "game:state",

    /** Лжец сделал выбор */
    LIAR_CHOSE = "game:liar:chose",

    /** Игрок проголосовал верит или нет */
    PLAYER_VOTED = "game:player:voted",

    /** Игрок подтвердил выбор */
    PLAYER_SECURED = "game:player:secured", 

    /** Игрок поставил лайк */
    PLAYER_LIKED = "game:player:liked",

    /** В игре поменялась стадия */
    STAGE_CHANGED = "game:stage:changed", 

    /** Админ начал игру */
    GAME_STARTED = "game:started",   
}
