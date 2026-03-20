import mongoose from "mongoose";
import { env } from "../config/env";

async function dropLegacyPlayersTelegramIndex(collectionName: 'lobbies' | 'games') {
  const db = mongoose.connection.db;
  if (!db) return;

  const collection = db.collection(collectionName);
  const indexes = await collection.indexes();
  const hasLegacyUniquePlayersTelegramIndex = indexes.some(
    (index) => index.name === 'players.telegramId_1',
  );
  const hasLegacyUniquePlayersIdIndex = indexes.some((index) => index.name === 'players.id_1');

  if (!hasLegacyUniquePlayersTelegramIndex && !hasLegacyUniquePlayersIdIndex) return;

  if (hasLegacyUniquePlayersTelegramIndex) {
    await collection.dropIndex('players.telegramId_1');
  }

  if (hasLegacyUniquePlayersIdIndex) {
    await collection.dropIndex('players.id_1');
  }
}

/**
 * Подключение к БД
 */
export async function connectToDatabase(uriOverride?: string) {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(uriOverride ?? env.DB_CONN_STRING, {
    dbName: env.DB_NAME,
  });

  await dropLegacyPlayersTelegramIndex('lobbies');
  await dropLegacyPlayersTelegramIndex('games');
}
