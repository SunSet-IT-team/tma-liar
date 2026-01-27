/**
    * Варианты размеров блока с игроком
*/
export type PlayerSize = | 'large' | 'medium' | 'default'

/** 
 * Игрок
*/
export type Player = {
    /** 
     * id игрока
    */
    id: number;
    /** 
     * картинка (аватар) игрока
    */
    photo?: string;
    /** 
     * имя игрока
    */
    name: string;
    /** 
     * лжец ли игрок
    */
    isLiar?: boolean;
    /** 
     * текущий игрок
    */
    currentPlayer?: boolean;
    /** 
     * Варианты размеров блока с игроком
    */
    variant?: PlayerSize;
    /** 
     * Верит ли игрок (выбор решало)
    */
    isBelieve?: boolean;
    /** 
     * Оценен ли игрок
    */
    isRated?: boolean;
    /** 
     * Очки игрока
    */
    points?: number;
}