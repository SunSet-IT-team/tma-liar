import type { Request, Response } from 'express';
import { GameService } from './game.service';
import { ApiError, success } from '../common/response';
import { GameNextStageDtoSchema, type GameNextStageDto } from './dtos/game-next-stage.dto';
import { GameLiarChoosesDtoSchema, type GameLiarChoosesDto } from './dtos/game-liar-chooses.dto';
import { GamePlayerVotedDtoSchema, type GamePlayerVotedDto } from './dtos/game-player-voted.dto';
import { GamePlayerSecuredDtoSchema, type GamePlayerSecuredDto } from './dtos/game-player-secured.dto';
import { GamePlayerLikedDtoSchema, type GamePlayerLikedDto } from './dtos/game-player-liked.dto';

/**
 * Контроллеры игры
 */
export class GameController {
  constructor(private gameService: GameService) {}

  /**
   * Контроллер перехода к следующей стадии
   */
  nextStage = async (req: Request, res: Response) => {
    const result = GameNextStageDtoSchema.safeParse({ gameId: req.params.gameId });

    if (!result.success) {
      throw new ApiError(400, "NEXT_STAGE_DATA_INVALID");
    }

    const dto: GameNextStageDto = result.data;
    const stage = await this.gameService.nextStage(dto);

    return res.status(200).json(success(stage));
  };

  /**
   * Контроллер выбора лжецом (врать / не врать)
   */
  liarChooses = async (req: Request, res: Response) => {
    const result = GameLiarChoosesDtoSchema.safeParse(req.body);

    if (!result.success) {
      throw new ApiError(400, "LIAR_CHOOSES_DATA_INVALID");
    }

    const dto: GameLiarChoosesDto = result.data;
    const doLie = await this.gameService.liarChooses(dto);

    return res.status(200).json(success(doLie));
  };

  /**
   * Контроллер установки ответа игрока
   */
  setAnswer = async (req: Request, res: Response) => {
    const result = GamePlayerVotedDtoSchema.safeParse(req.body);

    if (!result.success) {
      throw new ApiError(400, "SET_ANSWER_DATA_INVALID");
    }

    const dto: GamePlayerVotedDto = result.data;
    const player = await this.gameService.setAnswer(dto);

    return res.status(200).json(success(player));
  };

  /**
   * Контроллер подтверждения ответа игрока
   */
  confirmAnswer = async (req: Request, res: Response) => {
    const result = GamePlayerSecuredDtoSchema.safeParse(req.body);

    if (!result.success) {
      throw new ApiError(400, "CONFIRM_ANSWER_DATA_INVALID");
    }

    const dto: GamePlayerSecuredDto = result.data;
    const player = await this.gameService.confirmAnswer(dto);

    return res.status(200).json(success(player));
  };

  /**
   * Контроллер лайка ответа игрока
   */
  likeAnswer = async (req: Request, res: Response) => {
    const result = GamePlayerLikedDtoSchema.safeParse(req.body);

    if (!result.success) {
      throw new ApiError(400, "LIKE_ANSWER_DATA_INVALID");
    }

    const dto: GamePlayerLikedDto = result.data;
    const player = await this.gameService.likeAnswer(dto);

    return res.status(200).json(success(player));
  };
}
