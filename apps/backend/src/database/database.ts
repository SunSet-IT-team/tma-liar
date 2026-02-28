import mongoose from "mongoose";
import { env } from "../config/env";

async function dropLegacyLobbyIndexes() {
  const db = mongoose.connection.db;
  if (!db) return;

  const collection = db.collection('lobbies');
  const indexes = await collection.indexes();
  const hasLegacyUniquePlayersTelegramIndex = indexes.some(
    (index) => index.name === 'players.telegramId_1',
  );

  if (!hasLegacyUniquePlayersTelegramIndex) return;

  await collection.dropIndex('players.telegramId_1');
}

/**
 * Подключение к БД
 */
export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(env.DB_CONN_STRING, {
    dbName: env.DB_NAME,
  });

  await dropLegacyLobbyIndexes();
}
