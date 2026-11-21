import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from './index.mjs';

const origin = 'https://shop.example';
const env = { API_ORIGIN: 'https://backend.example' };
const expiresAt = new Date(Date.now() + 600_000).toISOString();
const jwt = `header.${Buffer.from(JSON.stringify({ sub: 'buyer', role: 'Buyer', exp: Math.floor(new Date(expiresAt).getTime() / 1000) })).toString('base64url')}.signature`;

test('login keeps tokens out of the response and restores the session from an HttpOnly cookie', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({ accessToken: jwt, accessTokenExpiresAtUtc: expiresAt, refreshToken: 'sensitive' }));
  const response = await worker.fetch(new Request(`${origin}/api/auth/login`, { method: 'POST', headers: { Origin: origin } }), env);
  const session = await response.json();
  assert.deepEqual(session.roles, ['Buyer']);
  assert.equal(session.accessToken, undefined);
  assert.equal(session.refreshToken, undefined);

  const cookie = response.headers.get('Set-Cookie');
  assert.match(cookie, /HttpOnly; Secure; SameSite=Strict/);
  const restored = await worker.fetch(new Request(`${origin}/api/session`, { headers: { Cookie: cookie.split(';')[0] } }), env);
  assert.deepEqual(await restored.json(), session);
});

test('cookie-authenticated mutations require the Worker origin', async (context) => {
  const upstream = context.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 204 }));
  const endpoint = `${origin}/api/cart/items`;
  const headers = { Cookie: `__Host-webshop-session=${jwt}` };
  const blocked = await worker.fetch(new Request(endpoint, { method: 'PUT', headers }), env);
  assert.equal(blocked.status, 403);
  assert.equal(upstream.mock.callCount(), 0);

  const accepted = await worker.fetch(new Request(endpoint, { method: 'PUT', headers: { ...headers, Origin: origin } }), env);
  assert.equal(accepted.status, 204);
  const options = upstream.mock.calls[0].arguments[1];
  assert.equal(options.headers.get('Authorization'), `Bearer ${jwt}`);
  assert.equal(options.headers.get('Cookie'), null);
});

test('same-origin logout expires the session cookie', async () => {
  const response = await worker.fetch(new Request(`${origin}/api/session`, {
    method: 'DELETE',
    headers: { Origin: origin, Cookie: `__Host-webshop-session=${jwt}` },
  }), env);

  assert.equal(response.status, 204);
  assert.match(response.headers.get('Set-Cookie'), /^__Host-webshop-session=; Max-Age=0;/);
});
