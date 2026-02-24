import http from "http";
import express from "express";
import { connectToDatabase } from "../database/database";
import { userRouter } from "../users/user.router";
import { errorMiddleware } from "../middlewares/errorHandler.middleware";
import { UserModel } from "../users/user.modal";

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

const ts = Date.now();
const testTelegramId = `test-user-${ts}`;
const createUserBody = {
  telegramId: testTelegramId,
  nickname: `TestUser${ts}`,
  profileImg: "https://example.com/avatar.png",
};

// ─── Helpers ───

async function request(
  method: string,
  path: string,
  body?: object
): Promise<{ status: number; data: unknown }> {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
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
  app.use("/api/users", userRouter);
  app.use(errorMiddleware);

  server = http.createServer(app);
  await new Promise<void>((resolve) => server!.listen(0, () => resolve()));
  const port = (server!.address() as { port: number }).port;
  baseUrl = `http://localhost:${port}`;
}

async function teardown() {
  await UserModel.deleteMany({ telegramId: testTelegramId });
  server?.close();
}

// ─── Test ───

(async () => {
  try {
    await setup();

    // 1. GET /api/users — без query telegramIds → 400
    const findUsersNoQueryRes = await request("GET", "/api/users");
    assert(findUsersNoQueryRes.status === 400, "findUsers 400 when no telegramIds", findUsersNoQueryRes);

    // 2. GET /api/users?telegramIds= — пустой массив после парсинга → 400
    const findUsersEmptyRes = await request("GET", "/api/users?telegramIds=");
    assert(findUsersEmptyRes.status === 400, "findUsers 400 for empty telegramIds", findUsersEmptyRes);

    // 3. GET /api/users?telegramIds=nonExistent — валидный query, но пользователей нет → 400 (USERS_NOT_FOUND)
    const findUsersEmptyListRes = await request("GET", `/api/users?telegramIds=${testTelegramId}`);
    assert(findUsersEmptyListRes.status === 400, "findUsers 400 when no users match", findUsersEmptyListRes);

    // 4. POST /api/users — создание пользователя
    const createRes = await request("POST", "/api/users", createUserBody);
    assert(createRes.status === 200, `createUser 200, got ${createRes.status}`, createRes);
    const created = (createRes.data as { payload?: { telegramId?: string; nickname?: string } }).payload;
    assert(created?.telegramId === testTelegramId, "createUser returns payload.telegramId", createRes);
    assert(created?.nickname === createUserBody.nickname, "createUser returns payload.nickname", createRes);

    // 5. GET /api/users/:telegramId — один пользователь
    const findUserRes = await request("GET", `/api/users/${testTelegramId}`);
    assert(findUserRes.status === 200, "findUser 200", findUserRes);
    const findPayload = (findUserRes.data as { payload?: { telegramId?: string } }).payload;
    assert(findPayload?.telegramId === testTelegramId, "findUser returns same telegramId", findUserRes);

    // 6. GET /api/users/:telegramId — несуществующий пользователь → 400 (сервис USER_NOT_FOUND)
    const notFoundRes = await request("GET", "/api/users/non-existent-telegram-id-12345");
    assert(notFoundRes.status === 400, "findUser 400 when not found", notFoundRes);

    // 7. GET /api/users?telegramIds=... — список с созданным пользователем
    const listAfterRes = await request("GET", `/api/users?telegramIds=${testTelegramId}`);
    assert(listAfterRes.status === 200, "findUsers 200 after create", listAfterRes);
    const listPayload = (listAfterRes.data as { payload?: { telegramId?: string }[] }).payload;
    assert(Array.isArray(listPayload) && listPayload.length >= 1, "findUsers includes created user", listAfterRes);

    // 8. PUT /api/users/:telegramId — обновление
    const updateRes = await request("PUT", `/api/users/${testTelegramId}`, {
      nickname: "UpdatedNickname",
    });
    assert(updateRes.status === 200, `updateUser 200, got ${updateRes.status}`, updateRes);
    const updated = (updateRes.data as { payload?: { nickname?: string } }).payload;
    assert(updated?.nickname === "UpdatedNickname", "updateUser returns updated nickname", updateRes);

    // 9. POST — невалидное тело (нет nickname)
    const invalidCreateRes = await request("POST", "/api/users", {
      telegramId: "some-id",
      nickname: "",
    });
    assert(invalidCreateRes.status === 400, "createUser 400 for invalid body", invalidCreateRes);

    // 10. PUT — невалидное тело (нет ни одного поля для обновления)
    const invalidUpdateRes = await request("PUT", `/api/users/${testTelegramId}`, {});
    assert(invalidUpdateRes.status === 400, "updateUser 400 when no update fields", invalidUpdateRes);

    // 11. DELETE /api/users/:telegramId
    const deleteRes = await request("DELETE", `/api/users/${testTelegramId}`);
    assert(deleteRes.status === 200, `deleteUser 200, got ${deleteRes.status}`, deleteRes);

    // 12. GET /api/users/:telegramId после удаления → 400 (сервис USER_NOT_FOUND)
    const afterDeleteRes = await request("GET", `/api/users/${testTelegramId}`);
    assert(afterDeleteRes.status === 400, "findUser 400 after delete", afterDeleteRes);

    // 13. DELETE — несуществующий пользователь → 400 (USER_NOT_FOUND из сервиса)
    const invalidDeleteRes = await request("DELETE", "/api/users/non-existent-telegram-id-12345");
    assert(invalidDeleteRes.status === 400, "deleteUser 400 when not found", invalidDeleteRes);

    console.log("All user endpoint tests passed.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await teardown();
  }
})();
