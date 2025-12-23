import express from 'express';
import cors from 'cors';
import { connectToDatabase } from './database/database.service';

const app = express();
app.use(cors());
app.get('/api/hello', (_, res) => res.json({ message: 'Hello from backend!' }));

/**
 * Функция для запуска сервера
 */
async function startServer() {
    try { 
        await connectToDatabase();
        app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));
    } catch(error) {
        throw error;
    }
}

await startServer();