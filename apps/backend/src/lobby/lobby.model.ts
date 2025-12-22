import { Schema, model } from 'mongoose';
import type { Lobby } from './entities/lobby.entity';

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
      enum: [
        'lobby',
        'liar_chooses',
        'question_to_liar',
        'liar_results',
        'results',
        'end',
      ],
      required: true,
      default: 'lobby',
    },

    adminId: {
      type: String
    },

    players: {
      type: [Object], 
      default: [],
    },

    settings: {
      type: Object, 
      required: true,
    },

    questionHistory: {
      type: [Object],
      default: [],
    },

    activeQuestion: {
      type: Object,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const LobbyModel = model<Lobby>('Lobby', LobbySchema);
