import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createApp, errorHandler } from '../app.js';

const secret = randomBytes(48).toString('hex');
const user = { id: 1, name: 'Demo Student', email: 'student@campusconnect.test' };
let server;
let base;
before(async () => {
  server = createApp({ secret, clientOrigin: 'http://localhost:5173' }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});
after(() => new Promise((resolve) => server.close(resolve)));

async function request(path, options) {
  const response = await fetch(`${base}${path}`, options);
  return { status: response.status, headers: response.headers, body: await response.json() };
}
function session(body) {
  return request('/sessions', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

test('health: exact 200 JSON', async () => {
  const result = await request('/health');
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { status: 'ok' });
});

test('demo login issues a one-hour HS256 token and public user only', async () => {
  const result = await session({ email: user.email, password: 'Campus26' });
  assert.equal(result.status, 200);
  assert.deepEqual(Object.keys(result.body).sort(), ['token', 'user']);
  assert.deepEqual(result.body.user, user);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  const claims = jwt.verify(result.body.token, secret, { algorithms: ['HS256'] });
  assert.equal(claims.sub, '1');
  assert.equal(claims.exp - claims.iat, 3600);
  const me = await request('/users/me', { headers: { Authorization: `Bearer ${result.body.token}` } });
  assert.equal(me.status, 200);
  assert.deepEqual(me.body, user);
});

test('wrong password and unknown email return identical 401 responses', async () => {
  for (const credentials of [
    { email: user.email, password: 'Wrong123' },
    { email: 'unknown@campusconnect.test', password: 'Campus26' },
    { email: user.email, password: 'short' },
    { email: user.email, password: 'Campus26 ' },
    { email: user.email, password: `Campus26${'x'.repeat(100)}` },
  ]) {
    const result = await session(credentials);
    assert.equal(result.status, 401);
    assert.deepEqual(result.body, { error: 'Invalid email or password.' });
  }
});

test('email lookup is case-insensitive and ignores surrounding whitespace', async () => {
  const result = await session({ email: ' STUDENT@CAMPUSCONNECT.TEST ', password: 'Campus26' });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.user, user);
});

test('missing, malformed and non-text credentials return 400 without leaking data', async () => {
  for (const body of [{}, null, [], { email: user.email }, { email: 1, password: 'Campus26' },
    { email: user.email, password: false }, { email: 'not-an-email', password: 'Campus26' },
    { email: user.email, password: '' }]) {
    const result = await session(body);
    assert.equal(result.status, 400);
    assert.deepEqual(result.body, { error: 'Email and password are required.' });
  }
  const malformed = await request('/sessions', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad json',
  });
  assert.equal(malformed.status, 400);
  assert.deepEqual(malformed.body, { error: 'Email and password are required.' });
});

test('missing, malformed, expired, wrongly signed and unknown-user tokens return 401', async () => {
  const tokens = [
    '', 'Bearer nonsense', 'Basic abc', 'Bearer abc def',
    `Bearer ${jwt.sign({}, secret, { subject: '1', expiresIn: -1 })}`,
    `Bearer ${jwt.sign({}, randomBytes(48).toString('hex'), { subject: '1', expiresIn: '1h' })}`,
    `Bearer ${jwt.sign({}, secret, { subject: '99', expiresIn: '1h' })}`,
    `Bearer ${jwt.sign({}, secret, { subject: '1' })}`,
    `Bearer ${jwt.sign({}, secret, { subject: '1', expiresIn: '1h', algorithm: 'HS384' })}`,
  ];
  for (const authorization of tokens) {
    const result = await request('/users/me', { headers: { Authorization: authorization } });
    assert.equal(result.status, 401);
    assert.deepEqual(result.body, { error: 'Not logged in.' });
  }
});

test('unknown routes and design-only events return JSON 404', async () => {
  for (const path of ['/missing', '/events?month=11']) {
    const result = await request(path);
    assert.equal(result.status, 404);
    assert.deepEqual(result.body, { error: 'Not found.' });
  }
});

test('CORS allows the configured browser origin, never echoes another origin', async () => {
  for (const origin of ['http://localhost:5173', 'https://untrusted.example']) {
    const result = await request('/health', { headers: { Origin: origin } });
    assert.equal(result.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    if (origin !== 'http://localhost:5173') {
      assert.notEqual(result.headers.get('access-control-allow-origin'), origin);
    }
  }
  const response = await fetch(`${base}/sessions`, {
    method: 'OPTIONS', headers: {
      Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });
  assert.equal(response.status, 204);
});

test('unexpected errors are sanitized as 500 JSON, without a production debug route', async () => {
  const app = express();
  app.get('/', () => { throw new Error('Private internal details'); });
  app.use(errorHandler);
  const failing = app.listen(0, '127.0.0.1');
  await once(failing, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${failing.address().port}/`);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Something went wrong.' });
  } finally {
    await new Promise((resolve) => failing.close(resolve));
  }
});
