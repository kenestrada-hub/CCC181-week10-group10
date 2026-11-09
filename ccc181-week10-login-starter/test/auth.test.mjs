import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthApi, ApiError, NETWORK_MESSAGE } from '../src/api/auth.ts';

const user = { id: 1, name: 'Demo Student', email: 'student@campusconnect.test' };
const reply = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
});

test('login calls the configured API, sends JSON and only accepts 200 with token and user', async () => {
  const api = createAuthApi('https://api.example.test/api/v1/', async (url, options) => {
    assert.equal(url, 'https://api.example.test/api/v1/sessions');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), { email: user.email, password: 'Campus26' });
    return reply({ token: 'test-placeholder', user });
  });
  assert.deepEqual(await api.login(` ${user.email} `, 'Campus26'), { token: 'test-placeholder', user });
});

test('getMe sends the token in a Bearer header, never in the URL', async () => {
  const api = createAuthApi('https://api.example.test/api/v1', async (url, options) => {
    assert.equal(url, 'https://api.example.test/api/v1/users/me');
    assert.equal(options.headers.Authorization, 'Bearer test-placeholder');
    return reply(user);
  });
  assert.deepEqual(await api.getMe('test-placeholder'), user);
});

test('400 and 401 are friendly failures; validation cannot promote them to success', async () => {
  for (const status of [400, 401]) {
    const api = createAuthApi('https://api.example.test', async () => reply({ error: 'Raw private text' }, status));
    await assert.rejects(api.login(user.email, 'Wrong123'), (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, status);
      assert.equal(error.message, 'Wrong email or password.');
      return true;
    });
  }
});

test('5xx and unexpected success codes are not Welcome states', async () => {
  for (const status of [500, 503, 201]) {
    const api = createAuthApi('https://api.example.test', async () => reply({ token: 'placeholder', user }, status));
    await assert.rejects(api.login(user.email, 'Campus26'), /Something went wrong on our side/);
  }
});

test('missing API setting, connection failures and timeouts never leak raw error text', async () => {
  const failing = createAuthApi('https://api.example.test', async () => { throw new TypeError('Failed to fetch'); });
  for (const api of [failing, createAuthApi(undefined)]) {
    await assert.rejects(api.login(user.email, 'Campus26'), (error) => error.message === NETWORK_MESSAGE);
  }
});

test('malformed JSON or incomplete 200 responses are rejected', async () => {
  for (const body of [null, {}, { user }, { token: '', user }, { token: 'placeholder', user: { name: 'Fake' } }]) {
    const api = createAuthApi('https://api.example.test', async () => reply(body));
    await assert.rejects(api.login(user.email, 'Campus26'), /Something went wrong on our side/);
  }
  const api = createAuthApi('https://api.example.test', async () => new Response('not json', { status: 200 }));
  await assert.rejects(api.getMe('placeholder'), /Something went wrong on our side/);
});
