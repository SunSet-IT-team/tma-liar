import type { DeckServiceUpdateDeckParams } from "../deck.params";
import type { Question } from "../entities/question.entity";

/**
 * DTO для updateDeck
 * @param id id колоды
 * @param name имя колоды
 * @param questionsCount количество вопросов в колоде
 * @param cover обложка колоды
 * @param questions массив заданных вопросов
 */
export class UpdateDeckDto { 
    id: string;
    name: string | undefined;
    questionsCount: number | undefined;
    cover: string | undefined; 
    questions: Question[] | undefined;

    constructor(data: DeckServiceUpdateDeckParams) { 
        this.id = data.id;
        this.name = data.name;
        this.questionsCount = data.questionsCount;
        this.cover = data.cover;
        this.questions = data.questions;
    }
}