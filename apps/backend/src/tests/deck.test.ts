import http from "http";
import express from "express";
import { connectToDatabase } from "./database/database";
import authRouter from "./auth/auth.router";
import { userRouter } from "./users/user.router";
import { deckRouter } from "./decks/deck.router";
import { errorMiddleware } from "./middlewares/errorHandler.middleware";
import { authMiddleware } from "./middlewares/auth.middleware";
import { DeckModel } from "./decks/deck.model";
import { UserModel } from "./users/user.modal";

function assert(condition: unknown, msg: string, received?: unknown): asserts condition {
  if (!condition) {
    if (received !== undefined) {
      console.error("Received:", JSON.stringify(received, null, 2));
    }
    throw new Error(`ASSERT: ${msg}`);
  }
}

// ─── State ───

let server: http.Server | undefined;
let baseUrl: string;
let authToken: string;

const ts = Date.now();
const testTelegramId = `deck-test-user-${ts}`;
const createUserBody = {
  telegramId: testTelegramId,
  nickname: `DeckTestUser${ts}`,
  profileImg: "https://example.com/avatar.png",
};

const sampleQuestions = [
  { id: "q1", type: "general", content: "What is your favorite color?", complexity: 1 },
  { id: "q2", type: "general", content: "What is your favorite food?", complexity: 1 },
];

const createDeckBody = {
  name: "Test Deck",
  questionsCount: 10,
  cover: "https://example.com/deck-cover.jpg",
  questions: sampleQuestions,
};

// ─── Helpers ───

async function request(
  method: string,
  path: string,
  body?: object,
  token?: string
): Promise<{ status: number; data: unknown }> {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as { status?: string; payload?: unknown; message?: string };
  const out = { status: res.status, data };
  console.log(`${method} ${path} →`, JSON.stringify(out, null, 2));
  return out;
}

// ─── Setup / Teardown ───

async function setup() {
  await connectToDatabase();

  const app = express();
  app.use(express.json());

  /** Без авторизации: логин и создание пользователя для теста */
  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);

  /** С авторизацией: колоды */
  app.use("/api/decks", authMiddleware, deckRouter);

  app.use(errorMiddleware);

  server = http.createServer(app);
  await new Promise<void>((resolve) => server!.listen(0, () => resolve()));
  const port = (server!.address() as { port: number }).port;
  baseUrl = `http://localhost:${port}`;
}

async function teardown() {
  await DeckModel.deleteMany({ name: createDeckBody.name });
  await UserModel.deleteMany({ telegramId: testTelegramId });
  server?.close();
}

// ─── Test ───

(async () => {
  try {
    await setup();

    // 0. Создать пользователя и залогиниться
    const createUserRes = await request("POST", "/api/users", createUserBody);
    assert(createUserRes.status === 200, "create test user 200", createUserRes);

    const loginRes = await request("GET", `/api/auth/${testTelegramId}`);
    assert(loginRes.status === 200, "login 200", loginRes);
    const tokenPayload = (loginRes.data as { payload?: { token?: string } }).payload;
    assert(tokenPayload?.token, "login returns token", loginRes);
    authToken = tokenPayload!.token as string;

    // 1. GET /api/decks — пустой список или уже есть колоды
    const listRes = await request("GET", "/api/decks", undefined, authToken);
    if (listRes.status === 200) {
      assert(Array.isArray((listRes.data as { payload?: unknown }).payload), "findDecks returns array", listRes);
    } else {
      assert(listRes.status === 400, "findDecks returns 400 when no decks", listRes);
    }

    // 2. POST /api/decks — создание колоды
    const createRes = await request("POST", "/api/decks", createDeckBody, authToken);
    assert(createRes.status === 200, `createDeck 200, got ${createRes.status}`, createRes);
    const created = (createRes.data as { payload?: { id?: string; name?: string } }).payload;
    assert(created?.id, "createDeck returns payload.id", createRes);
    assert(created?.name === createDeckBody.name, "createDeck returns payload.name", createRes);
    const deckId = created!.id;

    // 3. GET /api/decks — список с одной колодой
    const listAfterRes = await request("GET", "/api/decks", undefined, authToken);
    assert(listAfterRes.status === 200, "findDecks 200 after create", listAfterRes);
    const listPayload = (listAfterRes.data as { payload?: unknown[] }).payload;
    assert(Array.isArray(listPayload) && listPayload.length >= 1, "findDecks includes created deck", listAfterRes);

    // 4. GET /api/decks/:id — одна колода
    const findRes = await request("GET", `/api/decks/${deckId}`, undefined, authToken);
    assert(findRes.status === 200, "findDeck 200", findRes);
    const findPayload = (findRes.data as { payload?: { id?: string } }).payload;
    assert(findPayload?.id === deckId, "findDeck returns same id", findRes);

    // 5. GET /api/decks/:id — несуществующий id
    const notFoundRes = await request("GET", "/api/decks/000000000000000000000000", undefined, authToken);
    assert(notFoundRes.status === 400, "findDeck 400 for invalid id", notFoundRes);

    // 6. PUT /api/decks — обновление
    const updateRes = await request(
      "PUT",
      "/api/decks",
      { id: deckId, name: "Updated Deck Name" },
      authToken
    );
    assert(updateRes.status === 200, `updateDeck 200, got ${updateRes.status}`, updateRes);
    const updated = (updateRes.data as { payload?: { name?: string } }).payload;
    assert(updated?.name === "Updated Deck Name", "updateDeck returns updated name", updateRes);

    // 7. POST — невалидное тело (валидация DTO)
    const invalidCreateRes = await request(
      "POST",
      "/api/decks",
      { name: "", questionsCount: -1, cover: "", questions: [] },
      authToken
    );
    assert(invalidCreateRes.status === 400, "createDeck 400 for invalid body", invalidCreateRes);

    // 8. DELETE /api/decks/:id
    const deleteRes = await request("DELETE", `/api/decks/${deckId}`, undefined, authToken);
    assert(deleteRes.status === 200, `deleteDeck 200, got ${deleteRes.status}`, deleteRes);

    // 9. GET /api/decks/:id после удаления
    const afterDeleteRes = await request("GET", `/api/decks/${deckId}`, undefined, authToken);
    assert(afterDeleteRes.status === 400, "findDeck 400 after delete", afterDeleteRes);

    // 10. DELETE — невалидный id
    const invalidDeleteRes = await request("DELETE", "/api/decks/000000000000000000000000", undefined, authToken);
    assert(invalidDeleteRes.status === 400, "deleteDeck 400 for invalid id", invalidDeleteRes);

    console.log("All deck endpoint tests passed.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await teardown();
  }
})();
