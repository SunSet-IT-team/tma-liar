import { Schema, model } from 'mongoose';
import { GameStages } from '../lobby/entities/lobby.entity';
import type { Game } from './entities/game.entity';
import { SettingsModel } from '../lobby/settings.modal';
import { PlayerModel } from '../lobby/player.model';

/**
 * Схема Mongoose для сущности "Игра".
 */
export const GameSchema = new Schema<Game>(
  {
    /** Код лобби, к которому привязана игра */
    lobbyCode: {
      type: String,
      required: true,
      unique: true,
    },

    /** Текущая стадия игры (LOBBY, LIAR_CHOOSES, QUESTION_TO_LIAR и т.д.) */
    stage: {
      type: String,
      enum: Object.values(GameStages),
      required: true,
      default: GameStages.LOBBY,
    },

    /** Участники игры */
    players: {
      type: [PlayerModel],
      default: [],
    },

    /** Настройки игры (колода, количество вопросов, таймер и т.д.) */
    settings: {
      type: SettingsModel,
      required: true,
    },

    /** Id игрока-лжеца в текущем раунде */
    liarId: {
      type: String,
      default: null,
    },

    /** Список id вопросов, которые уже задавались */
    questionHistory: {
      type: [String],
      default: [],
    },

    /** Id активного вопроса в текущем раунде */
    activeQuestion: {
      type: String,
      default: null,
    },

    /** Идентификатор таймера (setTimeout) для авто-перехода стадий */
    timerId: {
      type: Schema.Types.Mixed,
      default: null,
    },

    /** Решение лжеца: врать (true) или нет (false) */
    doLie: {
      type: Boolean,
      default: null,
    },

    /** Задание для проигравшего (из настроек игрока) */
    loserTask: {
      type: String,
      default: null,
    },

    /** Id победителя по итогам игры */
    winnerId: {
      type: String,
      default: null,
    },

    /** Id проигравшего по итогам игры */
    loserId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

GameSchema.virtual('id').get(function () {
  return this._id.toString();
});

export const GameModel = model<Game>('Game', GameSchema);
