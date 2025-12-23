import { Router } from 'express';
import type { Request, Response } from 'express';

import { DeckApi } from './deck.service';
import type {
  DeckApiFindDeckParams,
  DeckApiFindDecksParams,
  DeckApiCreateDeckParams,
  DeckApiUpdateDeckParams,
  DeckApiDeleteDeckParams,
} from './deck.params';

import { asyncHandler } from '../middlewares/asyncHandler.middleware';
import { success, ApiError } from '../common/response';

export const deckController = Router();
const deckApi = new DeckApi();

deckController.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, 'DECK_ID_NOT_SET');

    const deck = await deckApi.findDeck({ id });
    if (!deck) throw new ApiError(404, 'DECK_NOT_FOUND');

    return res.status(200).json(success(deck));
  })
);

deckController.get('/', asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.query;

    if (!ids) throw new ApiError(400, 'DECK_IDS_NOT_SET');

    const deckIds: string[] = Array.isArray(ids)
      ? ids.map(String)
      : String(ids).split(',');

    const decks = await deckApi.findDecks({
      ids: deckIds,
    } as DeckApiFindDecksParams);

    return res.status(200).json(success(decks));
  })
);

deckController.post('/', asyncHandler(async (req: Request, res: Response) => {
    const deck = await deckApi.createDeck(
      req.body as DeckApiCreateDeckParams
    );

    return res.status(201).json(success(deck));
  })
);

deckController.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, 'DECK_ID_NOT_SET');

    const updatedDeck = await deckApi.updateDeck({
      id,
      ...req.body,
    } as DeckApiUpdateDeckParams);

    return res.status(200).json(success(updatedDeck));
  })
);

deckController.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, 'DECK_ID_NOT_SET');

    const deletedDeck = await deckApi.deleteDeck({
      id,
    } as DeckApiDeleteDeckParams);

    return res.status(200).json(success(deletedDeck));
  })
);
