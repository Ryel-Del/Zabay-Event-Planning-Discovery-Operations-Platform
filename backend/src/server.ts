import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Cross-Origin Resource Sharing setup
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Liveness & health probe
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Zabay Backend API',
    region: 'Tagbilaran City, Bohol, PH',
  });
});

// Mount core domain routers
app.use('/api', apiRouter);

// Centralized error boundary
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Zabay API]: Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  console.log(`[Zabay API]: Allowing CORS requests from ${CLIENT_URL}`);
});

export default app;
