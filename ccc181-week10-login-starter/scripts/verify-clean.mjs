// Verify unpublished changes without copying local secrets or installed dependencies.
// This is a clean-folder test, not a claim that unpublished code was cloned from GitHub.
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, copyFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import assert from 'node:assert/strict';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const parent = fileURLToPath(new URL('../../../.verification/', import.meta.url));
await mkdir(parent, { recursive: true });
const destination = await mkdtemp(join(parent, 'campusconnect-'));
const listed = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: repo }).toString().split('\0').filter(Boolean);
for (const path of listed) {
  if (path.split('/').some((part) => part === 'node_modules' || part === 'dist' || part === '.env' || (part.startsWith('.env.') && part !== '.env.example'))) {
    throw new Error(`Refusing to copy a private/generated file: ${path}`);
  }
  await mkdir(dirname(join(destination, path)), { recursive: true });
  await copyFile(join(repo, path), join(destination, path));
}
const root = join(destination, 'ccc181-week10-login-starter');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
async function run(command, args, cwd = root) {
  const child = spawn(command, args, { cwd, stdio: 'inherit' });
  const [code] = await once(child, 'exit');
  if (code !== 0) throw new Error(`${command} ${args.join(' ')} failed (${code}).`);
}
function start(args, cwd) {
  return spawn(process.execPath, args, { cwd, stdio: 'inherit' });
}
async function ready(url) {
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch(url)).ok) return; } catch { /* Wait for startup. */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`App never started: ${url}`);
}
for (const path of ['.env', 'server/.env', 'node_modules', 'server/node_modules']) {
  await assert.rejects(access(join(root, path)), `${path} must not come from the working copy.`);
}
console.log(`Clean folder: ${destination}`);
await run(npm, ['ci']);
await run(npm, ['ci'], join(root, 'server'));
await run(npm, ['run', 'setup']);
await run(npm, ['run', 'build']);
await run(npm, ['test']);
const api = start(['index.js'], join(root, 'server'));
const page = start(['node_modules/vite/bin/vite.js', '--port', '5173', '--strictPort'], root);
try {
  await ready('http://localhost:3000/api/v1/health');
  await ready('http://localhost:5173');
  await run(process.execPath, ['scripts/capture-demo.mjs']);
  console.log('PASS: independent installs, generated local settings, build, regression tests and live browser demo.');
  console.log('Before the exam, repeat from an actual fresh GitHub clone after teammate-reviewed PRs are merged.');
} finally {
  api.kill('SIGTERM');
  page.kill('SIGTERM');
}
