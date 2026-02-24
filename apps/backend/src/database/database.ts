import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "config/.env") });

/**
 * Подключение к БД
 */
export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return;

  const DB_CONN_STRING = process.env.DB_CONN_STRING ?? "";
  const DB_NAME = process.env.DB_NAME ?? "liar";

  if (!DB_CONN_STRING || !DB_NAME) {
    console.log(process.cwd());
    throw new Error("ENV_UNDEFINED");
  }

  await mongoose.connect(DB_CONN_STRING, {
    dbName: DB_NAME,
  });

    console.log("connected!");
}