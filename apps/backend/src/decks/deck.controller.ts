import type { Request, Response } from 'express';
import { DeckService } from './deck.service';
import { 
  findDeckIdValidator,
  findDecksIdsValidator,
  createDeckValidator,
  updateDeckValidator,
  deleteDeckIdValidator
} from './deck.validator';
import { FindDeckDto } from './dto/find-deck.dto';
import { FindDecksDto } from './dto/find-decks.dto';
import { success } from '../common/response';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import { DeleteDeckDto } from './dto/delete-deck.dto';

const deckService = new DeckService();

/**
 * Класс контроллеров колод
 */
export class DeckController { 
  /**
   * Контроллер поиска колоды
   */
  public async findDeck(req: Request, res: Response) {
    const id = findDeckIdValidator(req.params.id);

    const dto = new FindDeckDto(id);

    const deck = await deckService.findDeck({ id: dto.id });
    
    return res.status(200).json(success(deck));
  }

  /**
   * Контроллер поиска нескольких колод
   */
  public async findDecks(req: Request, res: Response) {
    const dto = new FindDecksDto(findDecksIdsValidator(req.body.ids).ids);

    const decks = await deckService.findDecks({ ids: dto.ids });
    
    return res.status(200).json(success(decks));
  }

  /**
   * Контроллер создания колоды
   */
  public async createDeck(req: Request, res: Response) {
    const dto: CreateDeckDto = new CreateDeckDto(createDeckValidator(req.body));

    const deck = await deckService.createDeck({ ...dto });
    
    return res.status(200).json(success(deck));
  }

  /**
   * Контроллер обновления колоды
   */
  public async updateDeck(req: Request, res: Response) {
    const dto: UpdateDeckDto = new UpdateDeckDto(updateDeckValidator(req.body));

    const deck = await deckService.updateDeck({...dto});
    
    return res.status(200).json(success(deck));
  }

  /**
   * Контроллер удаления колоды
   */
  public async deleteDeck(req: Request, res: Response) {
    const id = deleteDeckIdValidator(req.params.id);

    const dto = new DeleteDeckDto(id);

    const deck = await deckService.deleteDeck({ id: dto.id });
    
    return res.status(200).json(success(deck));  
  }
}
