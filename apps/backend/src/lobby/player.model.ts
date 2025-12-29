import { Schema } from 'mongoose';
import type { Player } from './entities/player.entity';

export const PlayerSchema = new Schema<Player>(
  {
    nickname: { type: String, required: true },
    telegramId: { type: String, required: true, unique: true },
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

    secure: {
      type: Boolean, 
      default: false,
    }
  },
  {
    _id: false, 
    versionKey: false,
  }
);
