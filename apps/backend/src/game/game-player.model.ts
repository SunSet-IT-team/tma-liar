import { Schema } from 'mongoose';
import type { Player } from '../lobby/entities/player.entity';

/**
 * @TODO разобраться в чем разница между PlayerModel и GamePlayerModel
 */

/**
 * Схема игроков, встроенных в документ `Game`.
 *
 * Важно: в `Lobby` поля `id/telegramId` имеют `unique` индексы (чтобы игрок
 * не мог находиться в разных лобби одновременно).
 * Для `Game` такие `unique` индексы ломают создание игры, потому что одни и те же
 * игроки неизбежно будут повторяться в разных документах `Game`.
 */
export const GamePlayerModel = new Schema<Player>(
  {
    // Никаких unique-индиксов для embedded players: иначе будет E11000 при старте.
    id: { type: String, index: true },
    nickname: { type: String, required: true },
    telegramId: { type: String, index: true },
    profileImg: { type: String },
    passwordHash: { type: String },
    token: { type: String },

    score: { type: Number, default: 0 },

    isReady: { type: Boolean, default: null },

    inGame: { type: Boolean, default: false },

    loserTask: { type: String, default: null },

    wasLiar: { type: Number, default: 0 },

    answer: { type: Number, default: null },

    likes: { type: Number, default: 0 },

    isConfirmed: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    lean: { virtuals: true },
    toObject: { virtuals: true },
  },
);
