/**
 * Типы сообщения для Lobby
 */
export enum LobbyMessageTypes { 
    /** Изменён статус */
    STATUS_CHANGED = "lobby:changed:status", 

    /** Вошёл игрок */
    PLAYER_JOINED = "lobby:player:joined", 

    /** Игрок готов */
    PLAYED_READY = "lobby:player:ready",

    /** Вышел игрок */
    PLAYED_LEFT = "lobby:player:left", 

    /** Админ начал игру */
    GAME_STARTED = "lobby:game:started"   
}