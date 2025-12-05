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
    isLzhets?: boolean;
    isYou?: boolean;
    variant?: PlayerSize;
    isBelieve?: boolean;
    isRated?: boolean;
    points?: number;
}