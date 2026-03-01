import type { ClientSession } from 'mongoose';
import { GameModel } from './game.model';
import type { Game } from './entities/game.entity';
import type { Lobby } from '../lobby/entities/lobby.entity';

export class GameRepository {
  public startSession() {
    return GameModel.startSession();
  }

  public async findByIdLean(gameId: string): Promise<Game | null> {
    const game = await GameModel.findById(gameId).lean({ virtuals: true });
    if (!game) return null;

    const normalized = game as Game & { _id?: { toString: () => string } };
    if (!normalized.id && normalized._id) {
      normalized.id = normalized._id.toString();
    }

    return normalized;
  }

  public findByIdDocument(gameId: string) {
    return GameModel.findById(gameId);
  }

  public async createForLobby(
    lobbyCode: string,
    players: Lobby['players'],
    settings: Lobby['settings'],
    session?: ClientSession,
  ): Promise<Game> {
    const [game] = await GameModel.create(
      [{
        lobbyCode,
        players,
        settings,
      }],
      session ? { session } : undefined,
    );

    if (!game) {
      throw new Error('GAME_NOT_CREATED');
    }

    return game.toObject();
  }

  public async deleteById(gameId: string, session?: ClientSession): Promise<void> {
    await GameModel.findByIdAndDelete(gameId, session ? { session } : undefined);
  }

  public async deleteByLobbyCode(lobbyCode: string, session?: ClientSession): Promise<void> {
    await GameModel.findOneAndDelete({ lobbyCode }, session ? { session } : undefined);
  }
}
