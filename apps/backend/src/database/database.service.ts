import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";
import path, { resolve } from 'path';

/**
 * Подключение к БД
 */


let client: mongoDB.MongoClient; 
let db: mongoDB.Db;

/**
 * Cписок всех коллекций
 */
export const collections: {
    users?: mongoDB.Collection; 
    lobbies?: mongoDB.Collection; 
    decks?: mongoDB.Collection;
} = {};

/**
 * Функция для подключения к БД
 */
export async function connectToDatabase () {
    if(client && db) {
        throw new Error("ALREADY_CONNECTED"); 
    }
    try {
        dotenv.config();

        if(process.env.DB_CONN_STRING == undefined || process.env.DB_NAME == undefined) {
            throw new Error("ENV_UNDEFINED")
        }

        client = new mongoDB.MongoClient(process.env.DB_CONN_STRING);
        await client.connect();  
        db = client.db(process.env.DB_NAME);
        
        collections.users = db.collection(process.env.USERS_COLLECTION_NAME!);
        collections.lobbies = db.collection(process.env.LOBBIES_COLLECTION_NAME!);
        collections.decks = db.collection(process.env.DECKS_COLLECTION_NAME!);

    } catch(error) { 
        throw error;
    }
}
