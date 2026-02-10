import type { Question } from "./entities/question.entity";

/**
 * Интерфейсы для методов сервиса колод
 */

/**
 * Интерфейс для метода поиска колоды
 * @param id айди колоды
 */
export interface DeckServiceFindDeckParams {
  id: string;
}

/**
 * Интерфейс для метода поиска нескольких колод
 * @param ids массив айди колод
 */
export interface DeckServiceFindDecksParams {
  ids: string[];
}

/**
 * Интерфейс для метода создания колоды
 * @param name название колоды
 * @param questionsCount количество вопросов в колоде
 * @param cover обложка колоды
 * @param questions массив вопросов колоды
 */
export interface DeckServiceCreateDeckParams {
  name: string;
  questionsCount: number;
  cover: string;
  questions: Question[];
}

/**
 * Интерфейс для метода обновления колоды
 * @param id айди колоды
 * @param name название колоды
 * @param questionsCount количество вопросов в колоде
 * @param cover обложка колоды
 * @param questions массив вопросов колоды
 */
export interface DeckServiceUpdateDeckParams {
  id: string;
  name?: string;
  questionsCount?: number;
  cover?: string;
  questions?: Question[];
}

/**
 * Интерфейс для метода удаления колоды
 * @param id айди колоды
 */
export interface DeckServiceDeleteDeckParams {
  id: string;
}
