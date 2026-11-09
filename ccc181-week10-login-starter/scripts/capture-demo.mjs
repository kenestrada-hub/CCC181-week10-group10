// Optional evidence generator: real headless Chrome, no extra npm packages.
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const cache = new URL('node_modules/.cache/', root);
await mkdir(cache, { recursive: true });
const profile = await mkdtemp(fileURLToPath(new URL('chrome-', cache)));
const chromePath = process.env.CHROME_BIN || (process.platform === 'darwin'
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome');
const chrome = spawn(chromePath, ['--headless', '--remote-debugging-port=0',
  `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', 'about:blank'],
{ stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Chrome did not start. Set CHROME_BIN.')), 15000);
  chrome.once('error', reject);
  chrome.stderr.on('data', (chunk) => {
    const match = chunk.toString().match(/DevTools listening on (ws:\/\/\S+)/);
    if (match) { clearTimeout(timer); resolve(match[1]); }
  });
});
const socket = new WebSocket(wsUrl);
await once(socket, 'open');
let nextId = 0;
const pending = new Map();
const posts = [];
const responses = [];
socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (data.id) {
    const waiter = pending.get(data.id);
    if (!waiter) return;
    pending.delete(data.id);
    if (data.error) waiter.reject(new Error(data.error.message));
    else waiter.resolve(data.result);
  }
  if (data.method === 'Network.requestWillBeSent'
      && data.params.request.method === 'POST'
      && data.params.request.url.endsWith('/sessions')) posts.push(data.params.request.url);
  if (data.method === 'Network.responseReceived' && data.params.response.url.includes('/api/v1/')) {
    responses.push({ url: data.params.response.url, status: data.params.response.status });
  }
});
let sessionId;
function send(method, params = {}, target = sessionId) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params, ...(target ? { sessionId: target } : {}) }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function waitFor(expression) {
  for (let attempt = 0; attempt < 150; attempt++) {
    try {
      if (await evaluate(expression)) return;
    } catch {
      // The page is navigating; try again in the new document.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out: ${expression}`);
}
// Page.reload returns before the new document exists, so wait for a fresh one.
async function reload() {
  await evaluate('window.__beforeReload = true');
  await send('Page.reload');
  await waitFor("document.readyState === 'complete' && !window.__beforeReload");
}
function lastStatus(path) {
  return responses.filter((entry) => entry.url.endsWith(path)).at(-1)?.status;
}
async function screenshot(name) {
  await evaluate('document.activeElement.blur(); window.scrollTo(0, 0)');
  const layout = await send('Page.getLayoutMetrics');
  const { width, height } = layout.cssContentSize;
  const result = await send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: true,
    clip: { x: 0, y: 0, width, height, scale: 1 },
  });
  await writeFile(new URL(`screenshots/${name}.png`, root), Buffer.from(result.data, 'base64'));
  console.log(`Saved ${name}.png (${width} x ${height})`);
}
async function fill(email, password) {
  await evaluate(`(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    for (const [id, value] of [['email', ${JSON.stringify(email)}], ['password', ${JSON.stringify(password)}]]) {
      const input = document.getElementById(id);
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
}
async function submit() {
  await evaluate("document.querySelector('button[type=submit]').click()");
}
async function assertNoOverflow() {
  assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false);
}

try {
  const target = await send('Target.createTarget', { url: 'about:blank' }, null);
  sessionId = (await send('Target.attachToTarget', { targetId: target.targetId, flatten: true }, null)).sessionId;
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 800, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:5173' });
  await waitFor("!!document.querySelector('button[type=submit]')");
  await submit();
  await waitFor("document.querySelectorAll('.form-error').length === 2");
  assert.equal(posts.length, 0);
  await assertNoOverflow();

  if (process.argv.includes('--server-down')) {
    await fill('student@campusconnect.test', 'Campus26');
    await submit();
    await waitFor("document.querySelector('.auth-message--error')?.textContent.includes('Cannot reach the server')");
    assert.equal(await evaluate("!!document.querySelector('#welcome-user-title')"), false);
    await assertNoOverflow();
    await screenshot('login-server-down-360');
    console.log('PASS: stopped backend gives friendly error, never Welcome.');
  } else {
    await fill('student@campusconnect.test', 'Wrong123');
    await submit();
    await waitFor("document.querySelector('.auth-message--error')?.textContent === 'Wrong email or password.'");
    assert.equal(lastStatus('/sessions'), 401);
    assert.equal(await evaluate("document.querySelector('#email').value"), 'student@campusconnect.test');
    assert.equal(await evaluate("!!document.querySelector('#welcome-user-title')"), false);
    await assertNoOverflow();
    await screenshot('login-fail-360');

    await fill('unknown@campusconnect.test', 'Campus26');
    const beforeUnknown = posts.length;
    await submit();
    await waitFor("!document.querySelector('button[type=submit]').disabled");
    assert.equal(posts.length, beforeUnknown + 1);
    assert.equal(lastStatus('/sessions'), 401);
    assert.equal(await evaluate("!!document.querySelector('#welcome-user-title')"), false);

    // Hold the real login request to verify loading and duplicate-submit protection.
    await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/v1/sessions', requestStage: 'Request' }] });
    const paused = new Promise((resolve) => {
      const listener = (event) => {
        const data = JSON.parse(event.data);
        if (data.method === 'Fetch.requestPaused') {
          socket.removeEventListener('message', listener);
          resolve(data.params.requestId);
        }
      };
      socket.addEventListener('message', listener);
    });
    await fill('student@campusconnect.test', 'Campus26');
    const beforeLogin = posts.length;
    await submit();
    const pausedId = await paused;
    await waitFor("document.querySelector('button[type=submit]').textContent === 'Signing in...'");
    assert.equal(await evaluate("document.querySelector('button[type=submit]').disabled"), true);
    await evaluate("document.querySelector('form').requestSubmit()");
    await send('Fetch.continueRequest', { requestId: pausedId });
    await send('Fetch.disable');
    await waitFor("document.querySelector('#welcome-user-title')?.textContent.trim() === 'Welcome, Demo Student'");
    assert.equal(posts.length, beforeLogin + 1);
    assert.equal(lastStatus('/sessions'), 200);
    await assertNoOverflow();
    await screenshot('login-success-360');
    const beforeRefresh = responses.length;
    await reload();
    await waitFor("document.querySelector('#welcome-user-title')?.textContent.trim() === 'Welcome, Demo Student'");
    assert.equal(responses.slice(beforeRefresh).some((entry) => entry.url.endsWith('/users/me') && entry.status === 200), true);
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await assertNoOverflow();
    assert.equal(await evaluate("document.querySelector('.auth-welcome button').getBoundingClientRect().height >= 48"), true);
    await screenshot('login-success-1280');
    await evaluate("document.querySelector('.auth-welcome button').click()");
    await waitFor("!!document.querySelector('button[type=submit]')");
    assert.equal(await evaluate("sessionStorage.getItem('campusconnect.token') === null"), true);
    await reload();
    await waitFor("!!document.querySelector('button[type=submit]')");
    assert.equal(await evaluate("!!document.querySelector('#welcome-user-title')"), false);
    console.log('PASS: empty/negative/happy paths, loading guard, refresh and logout.');
  }
} finally {
  socket.close();
  chrome.kill('SIGTERM');
}
