// Execute the collection's seven requests and assertions without extra packages.
// This does not replace the required Postman UI screenshots.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import vm from 'node:vm';
import { createApp } from '../app.js';

function expect(value) {
  let inverted = false;
  const chain = {
    eql(other) { assert.deepEqual(value, other); return chain; },
    a(type) { assert.equal(typeof value, type); return chain; },
    get to() { return chain; }, get be() { return chain; }, get and() { return chain; },
    get not() { inverted = true; return chain; },
    get empty() { assert.equal(value.length === 0, !inverted); return chain; },
  };
  return chain;
}

test('Postman collection: all seven live requests and embedded assertions pass', async () => {
  const collection = JSON.parse(await readFile(new URL('../../docs/postman/CampusConnect.postman_collection.json', import.meta.url)));
  const server = createApp({ secret: randomBytes(48).toString('hex'), clientOrigin: 'http://localhost:5173' }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const variables = new Map([['baseUrl', `http://127.0.0.1:${server.address().port}/api/v1`]]);
  let assertionCount = 0;
  const replace = (text) => text.replace(/\{\{(\w+)\}\}/g, (_all, key) => variables.get(key) || '');
  try {
    assert.equal(collection.item.length, 7);
    for (const item of collection.item) {
      let response;
      let body;
      const pm = {
        collectionVariables: { set: (key, value) => variables.set(key, value), unset: (key) => variables.delete(key) },
        test: (_name, check) => { check(); assertionCount++; }, expect,
        response: { json: () => body, to: { have: { status: (code) => assert.equal(response.status, code) } } },
      };
      const run = (phase) => {
        for (const event of (item.event || []).filter((event) => event.listen === phase)) {
          vm.runInNewContext(event.script.exec.join('\n'), { pm }, { timeout: 1000 });
        }
      };
      run('prerequest');
      response = await fetch(replace(item.request.url), {
        method: item.request.method,
        headers: Object.fromEntries((item.request.header || []).map(({ key, value }) => [key, replace(value)])),
        ...(item.request.body ? { body: item.request.body.raw } : {}),
      });
      body = await response.json();
      // Normalize cross-context objects for deep comparisons in the embedded scripts.
      pm.expect = (value) => {
        const normalize = (input) => JSON.parse(JSON.stringify(input));
        const chain = expect(value);
        chain.eql = (other) => { assert.deepEqual(normalize(value), normalize(other)); return chain; };
        return chain;
      };
      run('test');
    }
    assert.equal(assertionCount, 7);
    assert.equal(variables.has('token'), false, 'The collection must clear the runtime token.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
