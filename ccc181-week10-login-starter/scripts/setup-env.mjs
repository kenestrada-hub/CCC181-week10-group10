import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

const quiet = process.argv.includes('--quiet');
for (const path of ['.env', 'server/.env']) {
  const target = new URL(`../${path}`, import.meta.url);
  let content = await readFile(new URL(`../${path}.example`, import.meta.url), 'utf8');
  if (path === 'server/.env') {
    content = content.replace('change-this-to-a-long-random-text', randomBytes(48).toString('hex'));
  }
  try {
    await writeFile(target, content, { flag: 'wx', mode: 0o600 });
    if (!quiet) console.log(`Created ${path} (local only).`);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (!quiet) console.log(`Kept existing ${path}; nothing was overwritten.`);
  }
}
if (!quiet) {
  console.log('Start the API: cd server && npm install && npm start');
  console.log('Start the page in a second terminal: npm run dev');
}
