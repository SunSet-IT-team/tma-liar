import { Schema, model } from 'mongoose';
import type { Lobby } from './entities/lobby.entity';
import { GameStages } from './entities/lobby.entity';
import { PlayerSchema } from './player.model';
import { QuestionSchema } from '../decks/question.model';

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

    status: {
      type: String,
      enum: ['waiting', 'game', 'end'],
      required: true,
      default: 'waiting',
    },

    stage: {
      type: String,
      enum: Object.values(GameStages),
      required: true,
      default: GameStages.LOBBY,
    },

    adminId: {
      type: String,
      required: true,
    },

    players: {
      type: [PlayerSchema], 
      default: [],
    },

    settings: {
      type: Object, 
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
      type: QuestionSchema,
      default: null
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

export const LobbyModel = model<Lobby>('Lobby', LobbySchema);
