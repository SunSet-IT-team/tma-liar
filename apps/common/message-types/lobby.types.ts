/**
 * Типы сообщения для Lobby
 */
export enum LobbyMessageTypes { 
    /**  */
    /** Изменён статус */
    STATUS_CHANGED = "lobby:changed:status", 

    /** Вошёл игрок */
    PLAYER_JOINED = "lobby:player:joined", 

    /** Игрок готов */
    PLAYER_READY = "lobby:player:ready",

    /** Вышел игрок */
    PLAYER_LEFT = "lobby:player:left", 

    /** Лобби было удалено */
    LOBBY_DELETED = "lobby:deleted",
}