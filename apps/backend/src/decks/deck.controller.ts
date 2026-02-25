import type { Request, Response } from 'express';
import { DeckService } from './deck.service';
import { ApiError, success } from '../common/response';
import { FindDeckDtoSchema, type FindDeckDto } from './dtos/deck-find.dto';
import { CreateDeckDtoSchema, type CreateDeckDto } from './dtos/deck-create.dto';
import { UpdateDeckDtoSchema, type UpdateDeckDto } from './dtos/deck-update.dto';
import { DeleteDeckDtoSchema, type DeleteDeckDto } from './dtos/deck-delete.dto';

/**
 * Класс контроллеров колод
 */
export class DeckController {
  constructor(private deckService: DeckService) {}

  /**
   * Контроллер поиска колоды
   */
  findDeck = async (req: Request, res: Response) => {
    const result = FindDeckDtoSchema.safeParse({ id: req.params.id });

    if (!result.success) {
      throw new ApiError(422, "FIND_DECK_DATA_INVALID");
    }

    const dto: FindDeckDto = result.data;
    const deck = await this.deckService.findDeck({ id: dto.id });

    return res.status(200).json(success(deck));
  };

  /**
   * Контроллер поиска нескольких колод
   */
  findDecks = async (_: Request, res: Response) => {
    const decks = await this.deckService.findDecks();

    return res.status(200).json(success(decks));
  };

  /**
   * Контроллер создания колоды
   */
  createDeck = async (req: Request, res: Response) => {
    const result = CreateDeckDtoSchema.safeParse(req.body);

    if (!result.success) {
      throw new ApiError(422, "CREATE_DECK_DATA_INVALID");
    }

    const dto: CreateDeckDto = result.data;
    const deck = await this.deckService.createDeck({ ...dto });

    return res.status(200).json(success(deck));
  };

  /**
   * Контроллер обновления колоды
   */
  updateDeck = async (req: Request, res: Response) => {
    const result = UpdateDeckDtoSchema.safeParse(req.body);

    if (!result.success) {
      throw new ApiError(422, "UPDATE_DECK_DATA_INVALID");
    }

    const dto: UpdateDeckDto = result.data;
    const deck = await this.deckService.updateDeck({ ...dto });

    return res.status(200).json(success(deck));
  };

  /**
   * Контроллер удаления колоды
   */
  deleteDeck = async (req: Request, res: Response) => {
    const result = DeleteDeckDtoSchema.safeParse({ id: req.params.id });

    if (!result.success) {
      throw new ApiError(422, "DELETE_DECK_DATA_INVALID");
    }

    const dto: DeleteDeckDto = result.data;
    const deck = await this.deckService.deleteDeck({ id: dto.id });

    return res.status(200).json(success(deck));
  };
}
