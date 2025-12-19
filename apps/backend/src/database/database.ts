import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); 

/**
 * Подключение к БД
 */
export async function connectToDatabase() { 
    if(mongoose.connection.readyState === 1) return;

    if(process.env.DB_CONN_STRING == undefined || process.env.DB_NAME == undefined) {
        throw new Error("ENV_UNDEFINED")
    }

    await mongoose.connect(process.env.DB_CONN_STRING!, { 
        dbName: process.env.DB_NAME,
    });

    console.log("connected!");
}