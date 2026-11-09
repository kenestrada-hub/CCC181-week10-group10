import dotenv from 'dotenv';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

dotenv.config({ path: fileURLToPath(new URL('.env', import.meta.url)), quiet: true });
const port = Number(process.env.PORT || 3000);
// "http://localhost:5173/" would never match the browser's Origin header, so drop the slash.
const clientOrigin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(/\/+$/, '');
let secret = process.env.JWT_SECRET || '';

if (!Number.isInteger(port) || port < 1 || port > 65535 || !/^https?:\/\/[^/\s]+$/.test(clientOrigin)) {
  console.error('Check server/.env: PORT must be a number and CLIENT_ORIGIN must look like http://localhost:5173');
  process.exit(1);
}
if (secret.length < 32 || secret.startsWith('change-this')) {
  // Never sign tokens with the public example value; a random one keeps the demo running.
  secret = randomBytes(48).toString('hex');
  console.warn('Warning: JWT_SECRET in server/.env is missing or still the example value.');
  console.warn('Using a random secret for this run, so logins reset when the API restarts.');
  console.warn('Fix: run "npm run setup" in the project root, or put a long random text in server/.env.');
}

const app = createApp({ secret, clientOrigin });
const server = app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is already in use. Stop the other API process and retry.`
    : 'The API could not start. Check your configuration.');
  process.exit(1);
});
