import type { DeckServiceCreateDeckParams } from "../deck.params";
import type { Question } from "../entities/question.entity";

/**
 * DTO для createDeck
 * @param name имя колоды
 * @param questionsCount количество вопросов в колоде
 * @param cover обложка колоды
 * @param questions массив заданных вопросов
 */
export class CreateDeckDto { 
    name: string;
    questionsCount: number;
    cover: string; 
    questions: Question[];

    constructor(data: DeckServiceCreateDeckParams) { 
        this.name = data.name;
        this.questionsCount = data.questionsCount;
        this.cover = data.cover;
        this.questions = data.questions;
    }
}