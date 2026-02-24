/**
 * Маппинг маршрутов страниц приложения
*/

export enum PageRoutes {
    /** 
     * Страница ответа лжеца на вопрос
    */
    ANSWER_LIAR = 'answer-liar',
    /** 
     * Страница выбора решало
    */
    ANSWER_SOLVED = 'answer-solved',
    /** 
     * Страница ответов игроков
    */
    ANSWERS_PLAYERS = 'answers-players',
    /** 
     * Страница выбора вранья лжеца
    */
    CHOOSING_LIAR = 'choosing-liar',
    /** 
     * Страница присоединения к лобби
    */
    CONNECT_LOBBY = 'connect-lobby',
    /** 
     * Страница создания лобби
    */
    CREATE_LOBBY = 'create-lobby',
    /** 
     * Страница конец игры
    */
    END_GAME = 'end-game',
    /** 
     * Страница 404
    */
    NOT_FOUND = 'not-found',
    /** 
     * Профиль
    */
    PROFILE = 'profile',
    /** 
     * Страница оценки игроков
    */
    RATE_PLAYERS = 'rate-players',
    /** 
     * Страница результатов игры
    */
    RESULT_GAME = 'result-game',
    /** 
     * Страница правил
    */
    RULES = 'rules',
    /** 
     * Настройки
    */
    SETTINGS = 'settings',
    /** 
     * Страница лобби для админа
    */
    LOBBY_ADMIN = 'lobby-admin',
    /** 
     * Страница лобби для игроков
    */
    LOBBY_PLAYER = 'lobby-player',
    /** 
     * Страница ожидания решения игроков
    */
    WAITING_PLAYERS = 'waiting-players',
}