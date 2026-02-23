import dotenv from "dotenv";
import path from "path";

/*
 * Загрузка переменных из config/.env 
 */
dotenv.config({ path: path.resolve(process.cwd(), "config/.env") });
