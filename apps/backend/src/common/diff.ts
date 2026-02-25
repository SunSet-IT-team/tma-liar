import { env } from "../config/env";

const HIDDEN_DURING_GAME_FIELDS = env.hiddenDuringGameFields;
const GAME_RESULTS_FIELDS = env.gameResultsFields;

/**
 * Вычисляет diff между двумя объектами.
 * 
 * - Сохраняет вложенность: если изменилось вложенное свойство, 
 *   в diff попадёт путь до него с сохранением структуры.
 * - Массивы объектов: элементы сопоставляются по `id`. 
 *   В diff попадают только изменённые свойства + `id` для идентификации.
 *   Новые элементы (без совпадения по `id`) попадают целиком.
 *   Удалённые элементы помечаются как `{ id, _removed: true }`.
 * - Примитивы: попадают в diff только если значение изменилось.
 * 
 * @param oldObj - Старый объект
 * @param newObj - Новый объект
 * @param stage - Опциональная стадия игры (GameStages). Если указана, применяется фильтрация полей:
 *   - Во время игры (не GAME_RESULTS): скрываются doLie, questionHistory, liarId, timerId
 *   - В стадии GAME_RESULTS: отдаются только doLie, loserTask, winnerId, loserId
 */
export function findDiff(oldObj: any, newObj: any, stage?: string): any {
  if (newObj === null || newObj === undefined || typeof newObj !== "object") {
    return newObj !== oldObj ? newObj : undefined;
  }

  if (Array.isArray(newObj)) {
    return diffArrays(oldObj, newObj, stage);
  }

  const result: any = {};
  const safeOld = oldObj && typeof oldObj === "object" && !Array.isArray(oldObj) ? oldObj : {};

  // Определяем, нужно ли фильтровать поля
  // GameStages.GAME_RESULTS = 'game_results' (lowercase)
  // GameStages.END = 'end' (lowercase)
  const isGameResults = stage === 'game_results' || stage === 'GAME_RESULTS';
  const isEnd = stage === 'end' || stage === 'END';
  const isDuringGame = stage && !isGameResults && !isEnd && stage !== 'lobby' && stage !== 'LOBBY';

  for (const key in newObj) {
    // Фильтрация полей в зависимости от стадии
    if (isDuringGame && HIDDEN_DURING_GAME_FIELDS.includes(key)) {
      // Скрываем поля во время игры (кроме GAME_RESULTS)
      continue;
    }
    
    if (isGameResults && !GAME_RESULTS_FIELDS.includes(key) && key !== 'stage' && key !== 'players') {
      // В GAME_RESULTS отдаём только поля из GameEndDto + stage + players
      // (players нужны для отображения результатов)
      continue;
    }

    const newVal = newObj[key];
    const oldVal = safeOld[key];

    if (Array.isArray(newVal)) {
      const arrDiff = diffArrays(oldVal, newVal, stage);
      if (arrDiff.length > 0) {
        result[key] = arrDiff;
      }
    } else if (newVal !== null && typeof newVal === "object") {
      const subDiff = findDiff(oldVal, newVal, stage);
      if (subDiff !== undefined && Object.keys(subDiff).length > 0) {
        result[key] = subDiff;
      }
    } else if (newVal !== oldVal) {
      result[key] = newVal;
    }
  }

  return result;
}

/**
 * Diff для массивов.
 * - Объекты с `id` сопоставляются по `id`, 
 *   в diff попадают только изменённые свойства + `id`.
 * - Новые элементы (нет совпадения в old) попадают целиком.
 * - Удалённые элементы (есть в old, нет в new) попадают как `{ id, _removed: true }`.
 * - Примитивы: новые значения, которых не было в old.
 */
function diffArrays(oldArr: any, newArr: any[], stage?: string): any[] {
  if (!Array.isArray(oldArr)) {
    // old не был массивом — всё новое
    return newArr;
  }

  const result: any[] = [];

  for (const newItem of newArr) {
    if (newItem && typeof newItem === "object" && "id" in newItem) {
      // Ищем совпадение по id в старом массиве
      const oldItem = oldArr.find((o: any) => o?.id === newItem.id);

      if (oldItem) {
        // Вычисляем diff между совпавшими элементами
        const itemDiff = findDiff(oldItem, newItem, stage);
        if (itemDiff && Object.keys(itemDiff).length > 0) {
          result.push({ id: newItem.id, ...itemDiff });
        }
        // Если нет изменений — не включаем в diff
      } else {
        // Новый элемент — включаем целиком
        result.push(newItem);
      }
    } else {
      // Примитив или объект без id — включаем если не было в old
      const exists = oldArr.some((oldItem: any) =>
        typeof oldItem === "object"
          ? JSON.stringify(oldItem) === JSON.stringify(newItem)
          : oldItem === newItem
      );
      if (!exists) {
        result.push(newItem);
      }
    }
  }

  // Удалённые элементы: были в old, нет в new
  for (const oldItem of oldArr) {
    if (oldItem && typeof oldItem === "object" && "id" in oldItem) {
      const stillExists = newArr.some((n: any) => n?.id === oldItem.id);
      if (!stillExists) {
        result.push({ id: oldItem.id, _removed: true });
      }
    }

  }

  return result;
}
