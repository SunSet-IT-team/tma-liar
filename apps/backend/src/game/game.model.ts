import { Schema, model } from 'mongoose';
import { GameStages } from '../lobby/entities/lobby.entity';
import type { Game } from './entities/game.entity';
import { SettingsModel } from '../lobby/settings.modal';
import { PlayerModel } from '../lobby/player.model';

/**
 * Сущность "Игра"
 */
export const GameSchema = new Schema<Game>(
  {
    lobbyId: {
      type: String,
      required: true,
      unique: true
    },

    stage: {
      type: String,
      enum: Object.values(GameStages),
      required: true,
      default: GameStages.LOBBY,
    },

    players: {
      type: [PlayerModel], 
      default: [],
    },

    settings: {
      type: SettingsModel, 
      required: true,
    },
  
    liarId: { 
      type: String,
      default: null,
    },

    questionHistory: {
      type: [String],
      default: [],
    },

    activeQuestion: {
      type: String,
      default: null,
    },

    timerId: {
      type: Schema.Types.Mixed,
      default: null,
    },

    doLie: { 
      type: Boolean, 
      default: null,
    },

    loserTask: { 
      type: String, 
      default: null,
    },

    winnerId: {
      type: String, 
      default: null,
    }, 

    loserId: {
      type: String, 
      default: null,
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const GameModel = model<Game>('Game', GameSchema);
