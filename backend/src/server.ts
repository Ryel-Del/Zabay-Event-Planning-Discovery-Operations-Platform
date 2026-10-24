import { validateConfig } from './config/runtime';
validateConfig();
import app from './app';
const port = Number(process.env.PORT || 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port');
app.listen(port, '0.0.0.0', () => console.log(`Zabay listening on port ${port}`));
