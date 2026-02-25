import { io, type Socket as ClientSocket } from "socket.io-client";
import { Server } from "socket.io";
import http from "http";
import { registerLobbyHandler } from "../socket/lobby.socket";
import { registerGameHandler } from "../socket/game.socket";
import { LobbyMessageTypes } from "../../../common/message-types/lobby.types";
import { GameMessageTypes } from "../../../common/message-types/game.types";
import { connectToDatabase } from "../database/database";
import { LobbyService } from "../lobby/lobby.service";
import { LobbyStatus, GameStages } from "../lobby/entities/lobby.entity";
import { LobbyModel } from "../lobby/lobby.model";
import { GameModel } from "../game/game.model";

function assert(condition: any, msg: string) {
  if (!condition) throw new Error(`ASSERT: ${msg}`);
}

// ─── State ───

let ioServer: Server | undefined;
let server: http.Server | undefined;
let lobbyService: LobbyService | undefined;

let adminSocket: ReturnType<typeof io> | undefined;
let playerSocket: ReturnType<typeof io> | undefined;
let player3Socket: ReturnType<typeof io> | undefined;
let player4Socket: ReturnType<typeof io> | undefined;

let testLobbyCode: string | undefined;
let adminTelegramId: string | undefined;
let playerTelegramId: string | undefined;
let player3TelegramId: string | undefined;
let player4TelegramId: string | undefined;

// ─── Helpers ───

function connectClient(port: number): Promise<ReturnType<typeof io>> {
  return new Promise((resolve) => {
    const s = io(`http://localhost:${port}`);
    s.on("connect", () => resolve(s));
  });
}

/** Ждёт событие на сокете с таймаутом */
function waitEvent(socket: ReturnType<typeof io>, event: string, timeoutMs = 3000, filter?: (data: any) => boolean): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(event, handler);
      socket.off("error", errorHandler);
      reject(new Error(`Timeout waiting for "${event}"`));
    }, timeoutMs);

    const handler = (data: any) => {
      if (filter && !filter(data)) {
        // Событие не прошло фильтр, продолжаем ждать
        return;
      }
      clearTimeout(timeout);
      socket.off(event, handler);
      socket.off("error", errorHandler);
      resolve(data);
    };

    const errorHandler = (err: any) => {
      clearTimeout(timeout);
      socket.off(event, handler);
      socket.off("error", errorHandler);
      reject(new Error(`Socket error while waiting "${event}": ${JSON.stringify(err)}`));
    };

    socket.on(event, handler);
    socket.once("error", errorHandler);
  });
}

/** Ждёт событие на ОБОИХ сокетах */
async function waitBoth(event: string, timeoutMs = 3000): Promise<[any, any]> {
  return Promise.all([
    waitEvent(adminSocket!, event, timeoutMs),
    waitEvent(playerSocket!, event, timeoutMs),
  ]);
}

// ─── Setup / Teardown ───

async function setup() {
  await connectToDatabase();

  // Удаляем устаревшие/проблемные индексы
  try { await GameModel.collection.dropIndex("lobbyId_1"); } catch (_) {}
  try { await LobbyModel.collection.dropIndex("players.telegramId_1"); } catch (_) {}

  server = http.createServer();
  ioServer = new Server(server);
  lobbyService = new LobbyService();

  ioServer.on("connection", (socket) => {
    registerLobbyHandler(ioServer!, socket);
    registerGameHandler(ioServer!, socket);
  });

  await new Promise<void>((resolve) => server!.listen(() => resolve()));
  const port = (server!.address() as any).port;

  adminSocket = await connectClient(port);
  playerSocket = await connectClient(port);
  player3Socket = await connectClient(port);
  player4Socket = await connectClient(port);

  const ts = Date.now();
  adminTelegramId = `test-admin-${ts}`;
  playerTelegramId = `test-player-${ts}`;
  player3TelegramId = `test-player3-${ts}`;
  player4TelegramId = `test-player4-${ts}`;

  // Cleanup old data
  await LobbyModel.deleteMany({ adminId: adminTelegramId });
  await LobbyModel.deleteMany({ "players.telegramId": playerTelegramId });
  await LobbyModel.deleteMany({ "players.telegramId": player3TelegramId });
  await LobbyModel.deleteMany({ "players.telegramId": player4TelegramId });
}

async function teardown() {
  if (testLobbyCode) {
    try { await GameModel.deleteMany({ lobbyCode: testLobbyCode }); } catch (_) {}
    try { await lobbyService!.deleteLobby({ lobbyCode: testLobbyCode }); } catch (_) {}
  }
  adminSocket?.close();
  playerSocket?.close();
  player3Socket?.close();
  player4Socket?.close();
  ioServer?.close();
  server?.close();
}

// ─── Test ───

(async () => {
  try {
    await setup();

    const ts = Date.now();

    // 1. CREATE LOBBY
    const testLobby = await lobbyService!.createLobby({
      adminId: adminTelegramId!,
      players: [],
      settings: {
        deck: {
          name: "Test Deck", questionsCount: 10,
          cover: "https://example.com/deck-cover.jpg",
          questions: [
            { id: "q1", type: "general", content: "What is your favorite color?", complexity: 1 },
            { id: "q2", type: "general", content: "What is your favorite food?", complexity: 1 },
          ],
        },
        deckId: "1", questionCount: 5, answerTime: 30,
      },
    });
    testLobbyCode = testLobby.lobbyCode;

    // 2. ALL PLAYERS JOIN
    const adminJoinData = {
      lobbyCode: testLobbyCode,
      player: {
        id: `admin-id-${ts}`,
        nickname: "Admin",
        telegramId: adminTelegramId!,
        profileImg: "https://example.com/admin.png",
        score: 0, isReady: false, loserTask: "", wasLiar: 0,
        answer: null, likes: 0, isConfirmed: false,
      },
    };
    const adminJoinRes = waitEvent(adminSocket!, LobbyMessageTypes.PLAYER_JOINED);
    adminSocket!.emit(LobbyMessageTypes.PLAYER_JOINED, adminJoinData);
    const adminLobbyState = await adminJoinRes;
    const adminPlayerId = adminLobbyState.players[0].id;

    const playerJoinData = {
      lobbyCode: testLobbyCode,
      player: {
        id: `player-id-${ts}`,
        nickname: "Player2",
        telegramId: playerTelegramId!,
        profileImg: "https://example.com/player.png",
        score: 0, isReady: false, loserTask: "", wasLiar: 0,
        answer: null, likes: 0, isConfirmed: false,
      },
    };
    const playerJoinRes = waitEvent(playerSocket!, LobbyMessageTypes.PLAYER_JOINED);
    const adminNotifyOnJoin = waitEvent(adminSocket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_JOINED);
    playerSocket!.emit(LobbyMessageTypes.PLAYER_JOINED, playerJoinData);
    const [playerLobbyState] = await Promise.all([playerJoinRes, adminNotifyOnJoin]);
    const newPlayerId = playerLobbyState.players.find((p: any) => p.nickname === "Player2")?.id;

    const player3JoinData = {
      lobbyCode: testLobbyCode,
      player: {
        id: `player3-id-${ts}`,
        nickname: "Player3",
        telegramId: player3TelegramId!,
        profileImg: "https://example.com/player3.png",
        score: 0, isReady: false, loserTask: "", wasLiar: 0,
        answer: null, likes: 0, isConfirmed: false,
      },
    };
    const player3JoinRes = waitEvent(player3Socket!, LobbyMessageTypes.PLAYER_JOINED);
    const notifyOnPlayer3Join = waitEvent(adminSocket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_JOINED);
    const notifyOnPlayer3JoinP2 = waitEvent(playerSocket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_JOINED);
    player3Socket!.emit(LobbyMessageTypes.PLAYER_JOINED, player3JoinData);
    const [player3LobbyState] = await Promise.all([player3JoinRes, notifyOnPlayer3Join, notifyOnPlayer3JoinP2]);
    const player3Id = player3LobbyState.players.find((p: any) => p.nickname === "Player3")?.id;

    const player4JoinData = {
      lobbyCode: testLobbyCode,
      player: {
        id: `player4-id-${ts}`,
        nickname: "Player4",
        telegramId: player4TelegramId!,
        profileImg: "https://example.com/player4.png",
        score: 0, isReady: false, loserTask: "", wasLiar: 0,
        answer: null, likes: 0, isConfirmed: false,
      },
    };
    const player4JoinRes = waitEvent(player4Socket!, LobbyMessageTypes.PLAYER_JOINED);
    const notifyOnPlayer4Join = waitEvent(adminSocket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_JOINED);
    const notifyOnPlayer4JoinP2 = waitEvent(playerSocket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_JOINED);
    const notifyOnPlayer4JoinP3 = waitEvent(player3Socket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_JOINED);
    player4Socket!.emit(LobbyMessageTypes.PLAYER_JOINED, player4JoinData);
    const [player4LobbyState] = await Promise.all([player4JoinRes, notifyOnPlayer4Join, notifyOnPlayer4JoinP2, notifyOnPlayer4JoinP3]);
    const player4Id = player4LobbyState.players.find((p: any) => p.nickname === "Player4")?.id;

    // 3. ALL SET READY
    const adminReadyPromise = Promise.all([
      waitEvent(adminSocket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_READY),
      waitEvent(playerSocket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_READY),
      waitEvent(player3Socket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_READY),
      waitEvent(player4Socket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_READY),
    ]);
    adminSocket!.emit(LobbyMessageTypes.PLAYER_READY, {
      lobbyCode: testLobbyCode,
      playerId: adminPlayerId,
      loserTask: "Проигравший поёт",
    });
    await adminReadyPromise;

    const playerReadyPromise = Promise.all([
      waitEvent(adminSocket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_READY),
      waitEvent(playerSocket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_READY),
      waitEvent(player3Socket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_READY),
      waitEvent(player4Socket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_READY),
    ]);
    playerSocket!.emit(LobbyMessageTypes.PLAYER_READY, {
      lobbyCode: testLobbyCode,
      playerId: newPlayerId,
      loserTask: "Проигравший танцует",
    });
    await playerReadyPromise;

    const player3ReadyPromise = Promise.all([
      waitEvent(adminSocket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_READY),
      waitEvent(playerSocket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_READY),
      waitEvent(player3Socket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_READY),
      waitEvent(player4Socket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_READY),
    ]);
    player3Socket!.emit(LobbyMessageTypes.PLAYER_READY, {
      lobbyCode: testLobbyCode,
      playerId: player3Id,
      loserTask: "Проигравший поёт",
    });
    await player3ReadyPromise;

    const player4ReadyPromise = Promise.all([
      waitEvent(adminSocket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_READY),
      waitEvent(playerSocket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_READY),
      waitEvent(player3Socket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_READY),
      waitEvent(player4Socket!, "changeGameStatus", 3000, (data) => data.status === LobbyMessageTypes.PLAYER_READY),
    ]);
    player4Socket!.emit(LobbyMessageTypes.PLAYER_READY, {
      lobbyCode: testLobbyCode,
      playerId: player4Id,
      loserTask: "Проигравший рисует",
    });
    await player4ReadyPromise;

    // 4. GAME_STARTED
    const gameStartData = {
      lobbyCode: testLobbyCode,
      player: {
        id: adminTelegramId!,
        nickname: "Admin",
        telegramId: adminTelegramId!,
        profileImg: "https://example.com/admin.png",
        score: 0, isReady: true, loserTask: "Проигравший поёт", wasLiar: 0,
        answer: null, likes: 0, isConfirmed: false,
      },
      settings: {
        deck: {
          name: "Test Deck", questionsCount: 10,
          cover: "https://example.com/deck-cover.jpg",
          questions: [
            { id: "q1", type: "general", content: "What is your favorite color?", complexity: 1 },
            { id: "q2", type: "general", content: "What is your favorite food?", complexity: 1 },
          ],
        },
        deckId: "1", questionCount: 5, answerTime: 30,
      },
    };

    const gameStartPromise = Promise.all([
      waitEvent(adminSocket!, "changeGameStatus"),
      waitEvent(playerSocket!, "changeGameStatus"),
      waitEvent(player3Socket!, "changeGameStatus"),
      waitEvent(player4Socket!, "changeGameStatus"),
    ]);
    adminSocket!.emit(GameMessageTypes.GAME_STARTED, gameStartData);
    const [gameResAdmin] = await gameStartPromise;
    const gameId = gameResAdmin.gameId;

    // 5. WAIT FOR QUESTION_TO_LIAR STAGE AND SET ANSWERS
    let currentGame = await GameModel.findById(gameId).lean();
    let attempts = 0;
    while (currentGame && currentGame.stage !== GameStages.QUESTION_TO_LIAR && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      currentGame = await GameModel.findById(gameId).lean();
      attempts++;
    }

    if (!currentGame || currentGame.stage !== GameStages.QUESTION_TO_LIAR) {
      throw new Error(`Game did not reach QUESTION_TO_LIAR stage (current: ${currentGame?.stage})`);
    }

    // Set answers for non-liar players
    const nonLiarPlayersForAnswers = currentGame.players.filter(p => p.id !== currentGame?.liarId);
    for (const player of nonLiarPlayersForAnswers) {
      if (player && player.id) {
        adminSocket!.emit(GameMessageTypes.PLAYER_VOTED, {
          gameId: gameId,
          playerId: player.id,
          answer: 0, // 0 = верю, 1 = не верю
        });
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Wait a bit for answers to be processed
    await new Promise(resolve => setTimeout(resolve, 500));

    // 6. WAIT FOR QUESTION_RESULTS STAGE
    attempts = 0;
    while (currentGame && currentGame.stage !== GameStages.QUESTION_RESULTS && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      currentGame = await GameModel.findById(gameId).lean();
      attempts++;
    }

    if (!currentGame || currentGame.stage !== GameStages.QUESTION_RESULTS) {
      throw new Error(`Game did not reach QUESTION_RESULTS stage (current: ${currentGame?.stage})`);
    }

    // 7. TEST PLAYER_SECURED AND PLAYER_LIKED
    const nonLiarPlayers = currentGame.players.filter(p => p.id !== currentGame?.liarId);
    
    console.log(`\nPlayers in QUESTION_RESULTS:`);
    nonLiarPlayers.forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p.nickname} (id: ${p.id}, answer: ${p.answer}, isConfirmed: ${p.isConfirmed})`);
    });
    console.log(`Liar ID: ${currentGame?.liarId}`);
    
    if (nonLiarPlayers.length >= 3) {
      const [player1, player2, player3] = nonLiarPlayers;

      if (!player1 || !player2 || !player3) {
        throw new Error("Not enough players for testing");
      }

      // TEST PLAYER_SECURED
      if (player1.answer !== null && player1.answer !== 2) {
        const securePromise = Promise.all([
          waitEvent(adminSocket!, "changeGameStatus", 3000, (data) => data.status === GameMessageTypes.PLAYER_SECURED),
          waitEvent(playerSocket!, "changeGameStatus", 3000, (data) => data.status === GameMessageTypes.PLAYER_SECURED),
          waitEvent(player3Socket!, "changeGameStatus", 3000, (data) => data.status === GameMessageTypes.PLAYER_SECURED),
          waitEvent(player4Socket!, "changeGameStatus", 3000, (data) => data.status === GameMessageTypes.PLAYER_SECURED),
        ]);
        adminSocket!.emit(GameMessageTypes.PLAYER_SECURED, {
          gameId: gameId,
          playerId: player1.id,
        });
        await securePromise;
        console.log(`${player1.nickname}: PLAYER_SECURED ✓`);
      } else {
        console.log(`⚠️  Skipping PLAYER_SECURED: player1.answer = ${player1.answer}`);
      }

      // TEST PLAYER_LIKED
      if (player1.answer !== null && player1.answer !== 2 && player2.id !== currentGame.liarId) {
        const like1Promise = Promise.all([
          waitEvent(adminSocket!, "changeGameStatus", 3000, (data) => data.status === GameMessageTypes.PLAYER_LIKED),
          waitEvent(playerSocket!, "changeGameStatus", 3000, (data) => data.status === GameMessageTypes.PLAYER_LIKED),
          waitEvent(player3Socket!, "changeGameStatus", 3000, (data) => data.status === GameMessageTypes.PLAYER_LIKED),
          waitEvent(player4Socket!, "changeGameStatus", 3000, (data) => data.status === GameMessageTypes.PLAYER_LIKED),
        ]);
        adminSocket!.emit(GameMessageTypes.PLAYER_LIKED, {
          gameId: gameId,
          senderId: player1.id,
          receiverId: player2.id,
        });
        await like1Promise;
        console.log(`${player1.nickname} → ${player2.nickname}: PLAYER_LIKED ✓`);
      } else {
        console.log(`⚠️  Skipping like1: player1.answer = ${player1.answer}, player2.id = ${player2.id}, liarId = ${currentGame.liarId}`);
      }

      if (player2.answer !== null && player2.answer !== 2 && player3.id !== currentGame.liarId) {
        const like2Promise = Promise.all([
          waitEvent(adminSocket!, "changeGameStatus", 3000, (data) => data.status === GameMessageTypes.PLAYER_LIKED),
          waitEvent(playerSocket!, "changeGameStatus", 3000, (data) => data.status === GameMessageTypes.PLAYER_LIKED),
          waitEvent(player3Socket!, "changeGameStatus", 3000, (data) => data.status === GameMessageTypes.PLAYER_LIKED),
          waitEvent(player4Socket!, "changeGameStatus", 3000, (data) => data.status === GameMessageTypes.PLAYER_LIKED),
        ]);
        adminSocket!.emit(GameMessageTypes.PLAYER_LIKED, {
          gameId: gameId,
          senderId: player2.id,
          receiverId: player3.id,
        });
        await like2Promise;
        console.log(`${player2.nickname} → ${player3.nickname}: PLAYER_LIKED ✓`);
      } else {
        console.log(`⚠️  Skipping like2: player2.answer = ${player2.answer}, player3.id = ${player3.id}, liarId = ${currentGame.liarId}`);
      }

      if (player3.answer !== null && player3.answer !== 2 && player1.id !== currentGame.liarId) {
        const like3Promise = Promise.all([
          waitEvent(adminSocket!, "changeGameStatus", 3000, (data) => data.status === GameMessageTypes.PLAYER_LIKED),
          waitEvent(playerSocket!, "changeGameStatus", 3000, (data) => data.status === GameMessageTypes.PLAYER_LIKED),
          waitEvent(player3Socket!, "changeGameStatus", 3000, (data) => data.status === GameMessageTypes.PLAYER_LIKED),
          waitEvent(player4Socket!, "changeGameStatus", 3000, (data) => data.status === GameMessageTypes.PLAYER_LIKED),
        ]);
        adminSocket!.emit(GameMessageTypes.PLAYER_LIKED, {
          gameId: gameId,
          senderId: player3.id,
          receiverId: player1.id,
        });
        await like3Promise;
        console.log(`${player3.nickname} → ${player1.nickname}: PLAYER_LIKED ✓`);
      } else {
        console.log(`⚠️  Skipping like3: player3.answer = ${player3.answer}, player1.id = ${player1.id}, liarId = ${currentGame.liarId}`);
      }
    } else {
      console.log(`⚠️  Not enough non-liar players: ${nonLiarPlayers.length} (need 3)`);
    }

    console.log("\n✅ Tests passed");
  } catch (err) {
    console.error("\n❌ Test failed:", err);
    await teardown();
    process.exit(1);
  }
})();
