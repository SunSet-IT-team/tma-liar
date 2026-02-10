import type { Request, Response } from 'express';
import { GameService } from './game.service';
import { success } from '../common/response';

import {
  startGameValidator,
  nextStageValidator,
  setAnswerValidator,
  likeAnswerValidator,
  confirmAnswerValidator,
  liarChoosesValidator,
} from './game.validators';

import {
  StartGameDto,
  NextStageDto,
  SetAnswerDto,
  LikeAnswerDto,
  ConfirmAnswerDto,
  LiarChoosesDto,
} from './game.dto';

const gameService = new GameService();

/**
 * Контроллеры игры
 */
export class GameController {
  /**
   * Контроллер старта игры
   */
  public async startGame(req: Request, res: Response) {
    const dto = new StartGameDto(startGameValidator(req.body));

    const game = await gameService.startGame(dto);

    return res.status(200).json(success(game));
  }

  /**
   * Контроллер перехода к следующей стадии
   */
  public async nextStage(req: Request, res: Response) {
    const dto = new NextStageDto(nextStageValidator(req.params.gameId));

    const stage = await gameService.nextStage({ gameId: dto.gameId });

    return res.status(200).json(success(stage));
  }

  /**
   * Контроллер выбора лжецом (врать / не врать)
   */
  public async liarChooses(req: Request, res: Response) {
    const dto = new LiarChoosesDto(liarChoosesValidator(req.body));

    const doLie = await gameService.liarChooses(dto.gameId, dto.answer);

    return res.status(200).json(success(doLie));
  }

  /**
   * Контроллер установки ответа игрока
   */
  public async setAnswer(req: Request, res: Response) {
    const dto = new SetAnswerDto(setAnswerValidator(req.body));

    const player = await gameService.setAnswer(dto);

    return res.status(200).json(success(player));
  }

  /**
   * Контроллер подтверждения ответа игрока
   */
  public async confirmAnswer(req: Request, res: Response) {
    const dto = new ConfirmAnswerDto(confirmAnswerValidator(req.body));

    const player = await gameService.confirmAnswer(dto.gameId, dto.playerId);

    return res.status(200).json(success(player));
  }

  /**
   * Контроллер лайка ответа игрока
   */
  public async likeAnswer(req: Request, res: Response) {
    const dto = new LikeAnswerDto(likeAnswerValidator(req.body));

    const player = await gameService.likeAnswer(dto);

    return res.status(200).json(success(player));
  }
}
