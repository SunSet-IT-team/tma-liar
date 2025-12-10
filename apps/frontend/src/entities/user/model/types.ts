/**
    * Варианты размеров блока с игроком
*/
export type PlayerSize = | 'large' | 'medium' | 'default'

/** 
 * Игрок
*/
export type Player = {
    id: number;
    photo?: string;
    name: string;
    isLiar?: boolean;
    currentPlayer?: boolean;
    variant?: PlayerSize;
    isBelieve?: boolean;
    isRated?: boolean;
    points?: number;
}