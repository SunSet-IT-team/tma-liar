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

export const deckController = Router();
const deckApi = new DeckApi();

deckController.get('/deck/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (id) {
      const deck = await deckApi.findDeck({ id } as DeckApiFindDeckParams);
      res.json(deck);
      res.status(200).end();
    } else {
      res.send('ID_NOT_SET');
      res.status(400).end();
    }
  } catch (err) {
    res.send('INTERNAL_ERROR');
    res.status(500).end();
  }
});

deckController.get('/decks', async (req: Request, res: Response) => {
  try {
    const query = req.body;
    if (Object.keys(query).length > 0) {
      const decks = await deckApi.findDecks(query as DeckApiFindDecksParams);
      res.json(decks);
      res.status(200).end();
    } else {
      res.send('IDS_NOT_SET');
      res.status(400).end();
    }
  } catch (err) {
    res.send('INTERNAL_ERROR');
    res.status(500).end();
  }
});

deckController.post('/new-deck', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newDeck = await deckApi.createDeck(data as DeckApiCreateDeckParams);
    res.json(newDeck);
    res.status(201).end();
  } catch (err) {
    res.send('INTERNAL_ERROR');
    res.status(500).end();
  }
});

deckController.put('/update-deck/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedDeck = await deckApi.updateDeck({
      ...data,
      id,
    } as DeckApiUpdateDeckParams);
    res.json(updatedDeck);
    res.status(201).end();
  } catch (err) {
    switch (err) {
      case 'DECK_NOT_EXIST':
        res.send('DECK_NOT_EXIST');
        res.status(400).end();
        break;
      case 'DECK_ID_NOT_SET':
        res.send('DECK_ID_NOT_SET');
        res.status(400).end();
        break;
      default:
        res.send('INTERNAL_ERROR');
        res.status(500).end();
    }
  }
});

deckController.delete('/update-deck/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (id) {
      const deletedDeck = await deckApi.deleteDeck({ id } as DeckApiDeleteDeckParams);
      res.json(deletedDeck);
      res.status(201).end();
    }
  } catch (err) {
    switch (err) {
      case 'DECK_NOT_EXIST':
        res.send('DECK_NOT_EXIST');
        res.status(400).end();
        break;
      case 'DECK_ID_NOT_SET':
        res.send('DECK_ID_NOT_SET');
        res.status(400).end();
        break;
      default:
        res.send('INTERNAL_ERROR');
        res.status(500).end();
    }
  }
});
