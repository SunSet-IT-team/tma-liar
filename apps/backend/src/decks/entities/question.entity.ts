/**
 * Сущность "Вопрос"
 */
export interface Question {
  id: string;
  type: string;
  content: string;
  complexity: number;
}
