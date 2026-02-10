import { Schema, model } from 'mongoose';
import type { Lobby } from './entities/lobby.entity';
import { PlayerSchema } from './player.model';
import { LobbyStatus } from './entities/lobby.entity';

/**
 * Сущность "Лобби"
 */
const LobbySchema = new Schema<Lobby>(
  {
    lobbyCode: {
      type: String,
      required: true,
      unique: true
    },
    
    adminId: {
      type: String,
      required: true,
    },

    currentGameId: { 
      type: String, 
      required: true,
      default: null,
    },

    status: {
      type: String,
      enum: Object.values(LobbyStatus),
      required: true,
      default: LobbyStatus.WAITING,
    },

    players: {
      type: [PlayerSchema], 
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const LobbyModel = model<Lobby>('Lobby', LobbySchema);
