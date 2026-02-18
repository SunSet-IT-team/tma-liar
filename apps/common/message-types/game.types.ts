/**
 * Типы сообщения для Game
 */
export enum GameMessageTypes { 
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
}