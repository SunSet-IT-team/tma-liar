import mongoose from "mongoose";
import { env } from "../config/env";

/**
 * Подключение к БД
 */
export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(env.DB_CONN_STRING, {
    dbName: env.DB_NAME,
  });
}
