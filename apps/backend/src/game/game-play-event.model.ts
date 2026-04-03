import { Schema, model } from 'mongoose';

/**
 * Факт старта игры (одна запись = один запуск игры в лобби, в т.ч. повторный в том же лобби).
 */
export interface GamePlayEvent {
  deckId: string;
  lobbyCode: string;
  playedAt: Date;
}

const GamePlayEventSchema = new Schema<GamePlayEvent>(
  {
    deckId: { type: String, required: true, index: true },
    lobbyCode: { type: String, required: true, index: true },
    playedAt: { type: Date, default: Date.now, required: true, index: true },
  },
  {
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

GamePlayEventSchema.index({ deckId: 1, playedAt: -1 });

export const GamePlayEventModel = model<GamePlayEvent>('GamePlayEvent', GamePlayEventSchema);
