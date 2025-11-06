import { Router } from 'express';
import type { Request, Response } from 'express';

import { LobbyApi } from './lobby.service';
import type {
  LobbyApiFindLobbyParams,
  LobbyApiFindLobbiesParams,
  LobbyApiCreateLobbyParams,
  LobbyApiUpdateLobbyParams,
  LobbyApiDeleteLobbyParams,
} from './lobby.params';

export const lobbyController = Router();
const lobbyApi = new LobbyApi();

lobbyController.get('/lobby', async (req: Request, res: Response) => {
  try {
    const { id, lobbyCode } = req.body;
    if (id) {
      const lobby = await lobbyApi.findLobby({ id } as LobbyApiFindLobbyParams);
      res.json(lobby);
      res.status(200).end();
    } else {
      if (lobbyCode) {
        const lobby = await lobbyApi.findLobby({ lobbyCode } as LobbyApiFindLobbyParams);
        res.json(lobby);
        res.status(200).end();
      } else {
        res.send('ID_OR_LOBBYCODE_NOT_SET');
        res.status(400).end();
      }
    }
  } catch (err) {
    res.send('INTERNAL_ERROR');
    res.status(500).end();
  }
});

lobbyController.get('/lobbies', async (req: Request, res: Response) => {
  try {
    const query = req.body;
    if (Object.keys(query).length > 0) {
      const lobbies = await lobbyApi.findLobbies(query as LobbyApiFindLobbiesParams);
      res.json(lobbies);
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

lobbyController.post('/new-lobby', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newLobby = await lobbyApi.createLobby(data as LobbyApiCreateLobbyParams);
    res.json(newLobby);
    res.status(201).end();
  } catch (err) {
    res.send('INTERNAL_ERROR');
    res.status(500).end();
  }
});

lobbyController.put('/update-lobby/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedLobby = await lobbyApi.updateLobby({
      ...data,
      id,
    } as LobbyApiUpdateLobbyParams);
    res.json(updatedLobby);
    res.status(201).end();
  } catch (err) {
    switch (err) {
      case 'LOBBY_NOT_EXIST':
        res.send('LOBBY_NOT_EXIST');
        res.status(400).end();
        break;
      case 'LOBBY_ID_NOT_SET':
        res.send('LOBBY_ID_NOT_SET');
        res.status(400).end();
        break;
      default:
        res.send('INTERNAL_ERROR');
        res.status(500).end();
    }
  }
});

lobbyController.delete('/update-lobby/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (id) {
      const deletedLobby = await lobbyApi.deleteLobby({ id } as LobbyApiDeleteLobbyParams);
      res.json(deletedLobby);
      res.status(201).end();
    }
  } catch (err) {
    switch (err) {
      case 'LOBBY_NOT_EXIST':
        res.send('LOBBY_NOT_EXIST');
        res.status(400).end();
        break;
      case 'LOBBY_ID_NOT_SET':
        res.send('LOBBY_ID_NOT_SET');
        res.status(400).end();
        break;
      default:
        res.send('INTERNAL_ERROR');
        res.status(500).end();
    }
  }
});
