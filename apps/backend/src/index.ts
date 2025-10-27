import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.get('/api/hello', (_, res) => res.json({ message: 'Hello from backend!' }));
app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));
