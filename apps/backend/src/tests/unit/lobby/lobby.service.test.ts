import { describe, expect, it, mock } from 'bun:test';
import { ApiError } from '../../../common/response';
import { LobbyStatus } from '../../../lobby/entities/lobby.entity';
import { LobbyService } from '../../../lobby/lobby.service';

const basePlayer: any = {
  id: 'admin',
  telegramId: 'admin',
  nickname: 'Admin',
  score: 0,
  isReady: false,
  loserTask: null,
  wasLiar: 0,
  answer: null,
  likes: 0,
  isConfirmed: false,
};

const baseLobby: any = {
  lobbyCode: 'ABC123',
  adminId: 'admin',
  currentGameId: null,
  status: LobbyStatus.WAITING,
  players: [basePlayer],
  settings: {
    deckId: 'deck',
    questionCount: 1,
    answerTime: 30,
    deck: { name: 'Deck', questionsCount: 1, cover: 'img', questions: [] },
  },
};

describe('LobbyService', () => {
  it('findLobby returns object from document', async () => {
    const service = new LobbyService({ findByCodeDocument: async () => ({ toObject: () => baseLobby }) } as never);
    const lobby = await service.findLobby({ lobbyCode: 'ABC123' });
    expect(lobby.lobbyCode).toBe('ABC123');
  });

  it('findLobby throws when not found', async () => {
    const service = new LobbyService({ findByCodeDocument: async () => null } as never);
    await expect(service.findLobby({ lobbyCode: 'ABC123' })).rejects.toBeInstanceOf(ApiError);
  });

  it('findLobbies returns list and throws on empty', async () => {
    const serviceOk = new LobbyService({ findAll: async () => [baseLobby] } as never);
    expect((await serviceOk.findLobbies()).length).toBe(1);

    const serviceBad = new LobbyService({ findAll: async () => [] } as never);
    await expect(serviceBad.findLobbies()).rejects.toBeInstanceOf(ApiError);
  });

  it('create/update/delete lobby branches', async () => {
    const createOk = new LobbyService({ create: async () => baseLobby } as never);
    expect((await createOk.createLobby({ adminId: 'admin', players: baseLobby.players, settings: baseLobby.settings } as any)).adminId).toBe('admin');

    const createBad = new LobbyService({ create: async () => null } as never);
    await expect(createBad.createLobby({ adminId: 'admin', players: baseLobby.players, settings: baseLobby.settings } as any)).rejects.toBeInstanceOf(ApiError);

    const updateOk = new LobbyService({ updateByCode: async () => ({ ...baseLobby, status: LobbyStatus.STARTED }) } as never);
    expect((await updateOk.updateLobby({ lobbyCode: 'ABC123', status: LobbyStatus.STARTED } as any)).status).toBe(LobbyStatus.STARTED);

    const updateBad = new LobbyService({ updateByCode: async () => null } as never);
    await expect(updateBad.updateLobby({ lobbyCode: 'ABC123', status: LobbyStatus.STARTED } as any)).rejects.toBeInstanceOf(ApiError);

    const deleteOk = new LobbyService({ deleteByCode: async () => baseLobby } as never);
    expect((await deleteOk.deleteLobby({ lobbyCode: 'ABC123' })).lobbyCode).toBe('ABC123');

    const deleteBad = new LobbyService({ deleteByCode: async () => null } as never);
    await expect(deleteBad.deleteLobby({ lobbyCode: 'ABC123' })).rejects.toBeInstanceOf(ApiError);
  });

  it('joinLobby branches', async () => {
    const joinOk = new LobbyService({
      joinIfAllowed: async () => ({ ...baseLobby, players: [...baseLobby.players, { ...basePlayer, id: 'p2', telegramId: 'p2' }] }),
    } as never);
    expect((await joinOk.joinLobby({ lobbyCode: 'ABC123', player: { ...basePlayer, id: 'p2', telegramId: 'p2' } })).players.length).toBe(2);

    const notFound = new LobbyService({ joinIfAllowed: async () => null, findByCode: async () => null } as never);
    await expect(notFound.joinLobby({ lobbyCode: 'ABC123', player: { ...basePlayer, id: 'p2', telegramId: 'p2' } })).rejects.toBeInstanceOf(ApiError);

    const started = new LobbyService({
      joinIfAllowed: async () => null,
      findByCode: async () => ({ ...baseLobby, status: LobbyStatus.STARTED, currentGameId: 'g1' }),
    } as never);
    await expect(started.joinLobby({ lobbyCode: 'ABC123', player: { ...basePlayer, id: 'p2', telegramId: 'p2' } })).rejects.toBeInstanceOf(ApiError);

    const exists = new LobbyService({ joinIfAllowed: async () => null, findByCode: async () => ({ ...baseLobby }) } as never);
    await expect(exists.joinLobby({ lobbyCode: 'ABC123', player: { ...basePlayer } })).rejects.toBeInstanceOf(ApiError);
  });

  it('togglePlayerReady branches', async () => {
    const serviceReady = new LobbyService({
      findByCode: async () => ({ ...baseLobby }),
      setPlayerReady: async () => ({ ...baseLobby, players: [{ ...basePlayer, isReady: true, loserTask: 'task' }] }),
    } as never);
    expect((await serviceReady.togglePlayerReady({ lobbyCode: 'ABC123', playerId: 'admin', loserTask: 'task' })).players[0]?.isReady).toBeTrue();

    const serviceNotReady = new LobbyService({
      findByCode: async () => ({ ...baseLobby, players: [{ ...basePlayer, isReady: true, loserTask: 'task' }] }),
      setPlayerNotReady: async () => ({ ...baseLobby, players: [{ ...basePlayer, isReady: false, loserTask: null }] }),
    } as never);
    expect((await serviceNotReady.togglePlayerReady({ lobbyCode: 'ABC123', playerId: 'admin' })).players[0]?.isReady).toBeFalse();

    await expect(new LobbyService({ findByCode: async () => null } as never).togglePlayerReady({ lobbyCode: 'x', playerId: 'x' })).rejects.toBeInstanceOf(ApiError);
    await expect(new LobbyService({ findByCode: async () => ({ ...baseLobby, players: [] }) } as never).togglePlayerReady({ lobbyCode: 'x', playerId: 'x' })).rejects.toBeInstanceOf(ApiError);
    await expect(new LobbyService({ findByCode: async () => ({ ...baseLobby }) } as never).togglePlayerReady({ lobbyCode: 'x', playerId: 'admin' })).rejects.toBeInstanceOf(ApiError);
    await expect(
      new LobbyService({ findByCode: async () => ({ ...baseLobby }), setPlayerReady: async () => null } as never)
        .togglePlayerReady({ lobbyCode: 'x', playerId: 'admin', loserTask: 'task' }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('leaveLobby branches', async () => {
    const session = { withTransaction: async (cb: () => Promise<any>) => cb(), endSession: async () => undefined };

    const deleted = await new LobbyService({
      startSession: async () => session,
      findByCode: async () => ({ ...baseLobby }),
      removePlayer: async () => ({ ...baseLobby, players: [] }),
      deleteByCode: async () => baseLobby,
    } as never).leaveLobby({ lobbyCode: 'ABC123', telegramId: 'admin' });
    expect(deleted.deleted).toBeTrue();

    const nonAdmin = await new LobbyService({
      startSession: async () => session,
      findByCode: async () => ({ ...baseLobby }),
      removePlayer: async () => ({ ...baseLobby, players: [{ ...basePlayer }] }),
    } as never).leaveLobby({ lobbyCode: 'ABC123', telegramId: 'p2' });
    expect(nonAdmin.deleted).toBeFalse();

    const admin = await new LobbyService({
      startSession: async () => session,
      findByCode: async () => ({ ...baseLobby }),
      removePlayer: async () => ({ ...baseLobby, players: [{ ...basePlayer, id: 'new-admin', telegramId: 'new-admin' }] }),
      transferAdmin: async () => ({ ...baseLobby, adminId: 'new-admin', players: [{ ...basePlayer, id: 'new-admin', telegramId: 'new-admin' }] }),
    } as never).leaveLobby({ lobbyCode: 'ABC123', telegramId: 'admin' });
    expect(admin.newAdminId).toBe('new-admin');

    await expect(
      new LobbyService({ startSession: async () => session, findByCode: async () => null } as never).leaveLobby({ lobbyCode: 'x', telegramId: 'x' }),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      new LobbyService({ startSession: async () => session, findByCode: async () => ({ ...baseLobby }), removePlayer: async () => null } as never)
        .leaveLobby({ lobbyCode: 'x', telegramId: 'x' }),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      new LobbyService({
        startSession: async () => session,
        findByCode: async () => ({ ...baseLobby }),
        removePlayer: async () => ({ ...baseLobby, players: [{ ...basePlayer, id: 'new-admin', telegramId: 'new-admin' }] }),
        transferAdmin: async () => null,
      } as never).leaveLobby({ lobbyCode: 'x', telegramId: 'admin' }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
