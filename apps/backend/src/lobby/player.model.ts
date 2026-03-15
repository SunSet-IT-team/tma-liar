import { Schema } from 'mongoose';
import type { Player } from './entities/player.entity';

/**
 * id храним как поле: это id пользователя из коллекции users (источник правды).
 * Виртуальный id от _id не подходит — у каждого элемента массива players свой _id (subdocument),
 * а нам нужен именно user.id.
 */
export const PlayerModel = new Schema<Player>(
  {
    id: { type: String, index: true, unique: true },
    nickname: { type: String, required: true },
    telegramId: { type: String, required: true, index: true, unique: true },
    profileImg: { type: String },
    passwordHash: { type: String },
    token: { type: String },

    score: { 
      type: Number, 
      default: 0 
    },

    isReady: { 
      type: Boolean, 
      default: null 
    },

    inGame: {
      type: Boolean,
      default: false,
    },

    loserTask: { 
      type: String, 
      default: null 
    },

    likes: { 
      type: Number,
      default: 0, 
    }, 
    
    wasLiar: { 
      type: Number,
      default: 0,
    },

    answer: { 
      type: Number,
      default: null,
    },

    isConfirmed: {
      type: Boolean, 
      default: false,
    }
  },
  {
    versionKey: false,
    lean: { virtuals: true }, 
    toObject: { virtuals: true }, 
  }
);
