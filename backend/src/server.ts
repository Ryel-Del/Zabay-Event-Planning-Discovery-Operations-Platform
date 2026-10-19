import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.listen(PORT, () => {
  console.log(`[Zabay API]: Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  console.log(`[Zabay API]: Allowing CORS requests from ${CLIENT_URL}`);
});
