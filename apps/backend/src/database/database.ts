import mongoose from 'mongoose';
import { env } from '../config/env';

async function dropLegacyPlayersTelegramIndex(collectionName: 'lobbies' | 'games') {
  const db = mongoose.connection.db;
  if (!db) return;

  try {
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
  } catch (err: unknown) {
    const code = (err as { code?: number }).code;
    if (code === 26) return; // NamespaceNotFound — collection doesn't exist yet
    throw err;
  }
}

/**
 * @Более вдуичиво разобраться
 */
async function cleanupNullPlayerFields(collectionName: 'lobbies' | 'games') {
  const db = mongoose.connection.db;
  if (!db) return;

  try {
    const collection = db.collection(collectionName);

    await collection.updateMany({}, {
      $pull: {
        players: {
          $or: [{ telegramId: null }, { id: null }],
        },
      },
    } as any);
  } catch (err: unknown) {
    const code = (err as { code?: number }).code;
    if (code === 26) return; // NamespaceNotFound — collection doesn't exist yet
    throw err;
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

  // Cleanup corrupted snapshots (null subdocs) to avoid unique-index failures.
  await cleanupNullPlayerFields('lobbies');
  await cleanupNullPlayerFields('games');
}
