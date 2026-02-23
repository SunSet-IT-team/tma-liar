import { Schema, model } from 'mongoose';
import type { Lobby } from './entities/lobby.entity';
import { LobbyStatus } from './entities/lobby.entity';
import { SettingsModel } from './settings.modal';
import { PlayerModel } from './player.model';

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
      // required: true,
      default: null,
    },

    status: {
      type: String,
      enum: Object.values(LobbyStatus),
      required: true,
      default: LobbyStatus.WAITING,
    },

    players: {
      type: [PlayerModel], 
      default: [],
    },

    settings: { 
      type: SettingsModel, 
      required: true,
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
  }
);

LobbySchema.virtual('id').get(function () {
  return this._id.toString();
});

export const LobbyModel = model<Lobby>('Lobby', LobbySchema);
