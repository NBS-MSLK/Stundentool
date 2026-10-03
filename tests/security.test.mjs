import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { DatabaseSync } from 'node:sqlite';
import { PrismaClient } from '@prisma/client';

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
const routes = files('src/app/api').filter(f => f.endsWith('route.ts') && !f.endsWith(path.join('auth', 'route.ts'))).flatMap(file => {
  const code = fs.readFileSync(file, 'utf8');
  assert(!/export async function (GET|POST|PUT|DELETE)/.test(code), `${file} has an unprotected handler`);
  return [...code.matchAll(/export const (GET|POST|PUT|DELETE) = secureRoute\("([^"]+)"/g)].map(([, method, route]) => ({ method, route }));
});

test('session and API access integration', { timeout: 300000 }, async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stundentool-security-'));
  const databaseUrl = 'file:' + path.join(dir, 'test.sqlite').replaceAll('\\', '/');
  new DatabaseSync(path.join(dir, 'test.sqlite')).close();
  const env = { ...process.env, DATABASE_URL: databaseUrl, NEXT_TELEMETRY_DISABLED: '1', NODE_ENV: 'development' };
  delete env.APP_ORIGIN;
  const init = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--skip-generate'], { env, encoding: 'utf8' });
  assert.equal(init.status, 0, init.stdout + init.stderr);
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const admin = await prisma.user.create({ data: { name: 'Test Admin', password: 'admin-test-only', role: 'ADMIN' } });
  const alice = await prisma.user.create({ data: { name: 'Test Alice', password: 'alice-test-only' } });
  const bob = await prisma.user.create({ data: { name: 'Test Bob', password: 'bob-test-only' } });
  const blank = await prisma.user.create({ data: { name: 'Test Unactivated' } });
  const named = await prisma.user.create({ data: { name: 'Nils Beinke-Schulte', password: 'named-test-only', role: 'USER' } });
  const entry = await prisma.timeEntry.create({ data: { userId: bob.id, startTime: new Date(), endTime: new Date(), isConfirmed: true } });
  const aliceEntry = await prisma.timeEntry.create({ data: { userId: alice.id, startTime: new Date(), endTime: new Date() } });
  const task = await prisma.task.create({ data: { title: 'Bob task', creatorId: bob.id, creatorName: bob.name, steps: { create: { description: 'Step' } }, materials: { create: { name: 'Material' } } }, include: { steps: true, materials: true } });
  const aliceTask = await prisma.task.create({ data: { title: 'Alice task', creatorId: alice.id, creatorName: alice.name } });
  const category = await prisma.equipmentCategory.create({ data: { title: 'Bob category', creatorId: bob.id } });
  const suggestion = await prisma.equipmentSuggestion.create({ data: { categoryId: category.id, title: 'Bob suggestion', creatorId: bob.id, creatorName: bob.name, materials: { create: { name: 'Material' } } }, include: { materials: true } });
  const probe = net.createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const base = `http://localhost:${port}`;
  let log = '';
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '--port', String(port)], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', chunk => { log = (log + chunk).slice(-12000); });
  server.stderr.on('data', chunk => { log = (log + chunk).slice(-12000); });
  async function request(url, { method = 'GET', cookie, body, origin = base, contentType = 'application/json' } = {}) {
    const headers = { Origin: origin };
    if (cookie) headers.Cookie = cookie;
    if (body !== undefined) headers['Content-Type'] = contentType;
    return fetch(base + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  }
  async function login(user, password) {
    const response = await request('/api/auth', { method: 'POST', body: { name: user.name, password } });
    assert.equal(response.status, 200, await response.clone().text());
    const data = await response.json();
    assert(!('password' in data.user));
    const cookie = response.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=lax/i);
    return cookie.split(';')[0];
  }
  try {
    let ready = false;
    for (let i = 0; i < 120; i++) {
      try { if ((await fetch(base + '/api/auth')).status === 401) { ready = true; break; } } catch {}
      await delay(500);
    }
    assert(ready, log);
    let a = await login(alice, 'alice-test-only');
    const b = await login(bob, 'bob-test-only');
    const root = await login(admin, 'admin-test-only');

    await t.test('every existing API handler rejects anonymous access', async () => {
      assert(routes.length > 60);
      for (const { method, route } of routes) {
        const url = route.replaceAll('[id]', entry.id).replaceAll('[proposalId]', 'missing');
        const response = await request(url, { method });
        assert.equal(response.status, 401, `${method} ${route}: ${await response.text()}`);
      }
    });
    await t.test('fake sessions, empty passwords and name-based privilege escalation are rejected', async () => {
      assert.equal((await request('/api/users', { cookie: 'stundentool_session=' + 'a'.repeat(64) })).status, 401);
      assert.equal((await request('/api/auth', { method: 'POST', body: { name: blank.name, password: 'claim-account' } })).status, 401);
      assert.equal((await prisma.user.findUnique({ where: { id: blank.id } })).password, '');
      const cookie = await login(named, 'named-test-only');
      assert.equal((await request('/api/users', { cookie })).status, 403);
    });
    await t.test('members cannot administer users, finances, content or the seed endpoint', async () => {
      for (const [url, method, body] of [
        ['/api/users', 'GET'], ['/api/users', 'POST', { name: 'Attack', role: 'ADMIN' }],
        ['/api/logs', 'GET'], ['/api/funding', 'PUT', { baseHours: 0 }],
        ['/api/news', 'POST', { authorId: alice.id, title: 'Attack', content: 'No' }],
        ['/api/polls', 'POST', { question: 'Attack', options: ['A', 'B'] }],
        ['/api/equipment/budget', 'PUT', { totalAmount: 0 }],
        ['/api/equipment/reorder', 'POST', { updates: [] }],
        ['/api/equipment/auto-number', 'POST'], ['/api/equipment/seed?force=true', 'GET'],
      ]) assert.equal((await request(url, { method, cookie: a, body })).status, 403, url);
      assert.equal((await request('/api/equipment/seed?force=true', { cookie: root })).status, 403);
      assert.equal((await request('/api/users', { cookie: root })).status, 200);
    });
    await t.test('time entry and profile ownership is enforced', async () => {
      for (const method of ['GET', 'PUT', 'DELETE']) {
        assert.equal((await request(`/api/users/${bob.id}`, { method, cookie: a, body: method === 'PUT' ? { password: 'hijack' } : undefined })).status, 403);
        assert.equal((await request(`/api/entries/${entry.id}`, { method, cookie: a, body: method === 'PUT' ? { note: 'hijack' } : undefined })).status, 403);
      }
      assert.equal((await request(`/api/entries?userId=${bob.id}`, { cookie: a })).status, 403);
      assert.equal((await request('/api/entries?all=true', { cookie: a })).status, 403);
      assert.equal((await request(`/api/entries?userId=${alice.id}`, { cookie: a })).status, 200);
      assert.equal((await request(`/api/entries/${aliceEntry.id}`, { cookie: a, method: 'PUT', body: { note: 'Own edit' } })).status, 200);
      assert.equal((await request(`/api/entries/${aliceEntry.id}`, { cookie: a, method: 'PUT', body: { isArchived: true } })).status, 403);
      assert.equal((await request(`/api/entries/${aliceEntry.id}`, { cookie: root, method: 'PUT', body: { isArchived: true } })).status, 200);
      assert.equal((await request(`/api/entries/${aliceEntry.id}`, { cookie: a, method: 'DELETE' })).status, 403);
      for (const url of ['/api/entries/start', '/api/entries/stop', '/api/entries']) {
        assert.equal((await request(url, { cookie: a, method: 'POST', body: { userId: bob.id } })).status, 403);
      }
      assert.equal((await request('/api/entries', { cookie: root, method: 'POST', body: { userId: bob.id, startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T11:00:00Z' } })).status, 200);
    });
    await t.test('task/equipment ownership and nested resource IDs are checked', async () => {
      assert.equal((await request(`/api/tasks/${task.id}`, { cookie: a, method: 'PUT', body: { title: 'hijack' } })).status, 403);
      assert.equal((await request(`/api/tasks/${task.id}`, { cookie: b, method: 'PUT', body: { title: 'Owner edit' } })).status, 200);
      assert.equal((await request(`/api/tasks/${aliceTask.id}/step`, { cookie: a, method: 'PUT', body: { stepId: task.steps[0].id, isCompleted: true } })).status, 403);
      assert.equal((await request(`/api/tasks/${aliceTask.id}/material`, { cookie: a, method: 'PUT', body: { materialId: task.materials[0].id, isAcquired: true } })).status, 403);
      assert.equal((await request(`/api/tasks/${task.id}/step`, { cookie: a, method: 'PUT', body: { stepId: task.steps[0].id, isCompleted: true, userRole: 'ADMIN' } })).status, 403);
      assert.equal((await request(`/api/tasks/${task.id}/step`, { cookie: a, method: 'PUT', body: { stepId: task.steps[0].id, isCompleted: true } })).status, 200);
      for (const url of [`/api/equipment/${category.id}`, `/api/equipment/suggestions/${suggestion.id}`, `/api/equipment/materials/${suggestion.materials[0].id}`]) {
        assert.equal((await request(url, { cookie: a, method: 'PUT', body: { title: 'hijack', name: 'hijack' } })).status, 403);
      }
      assert.equal((await request(`/api/equipment/suggestions/${suggestion.id}`, { cookie: b, method: 'PUT', body: { title: 'Owner edit' } })).status, 200);
      assert.equal((await request(`/api/equipment/suggestions/${suggestion.id}`, { cookie: b, method: 'PUT', body: { status: 'PURCHASED' } })).status, 403);
    });
    await t.test('identity forgery and CSRF/content-type bypasses are blocked', async () => {
      for (const [url, body] of [
        ['/api/tasks', { creatorId: bob.id }],
        [`/api/tasks/${task.id}/volunteer`, { userId: bob.id, userName: bob.name }],
        [`/api/tasks/${task.id}/notes`, { userId: alice.id, userName: bob.name, content: 'fake' }],
        [`/api/tasks/${task.id}/subscribe`, { userId: bob.id, subscribe: true }],
        [`/api/polls/missing/vote`, { userId: bob.id }],
        [`/api/equipment/suggestions/${suggestion.id}/votes`, { userId: bob.id }],
      ]) assert.equal((await request(url, { cookie: a, method: 'POST', body })).status, 403, url);
      assert.equal((await request(`/api/users/${alice.id}`, { cookie: a, method: 'PUT', body: { email: 'test@example.invalid' }, origin: 'https://evil.invalid' })).status, 403);
      assert.equal((await request(`/api/tasks/${task.id}/notes`, { cookie: a, method: 'POST', body: { userId: bob.id }, contentType: 'text/plain' })).status, 415);
      assert.equal((await fetch(base + '/api/auth', { method: 'DELETE', headers: { Cookie: a } })).status, 403);
    });
    await t.test('credentials never appear in direct or nested API responses', async () => {
      for (const url of ['/api/users', `/api/users/${bob.id}`, '/api/entries?all=true', `/api/entries/${entry.id}`, '/api/tasks', `/api/tasks/${task.id}`, '/api/headlines']) {
        const response = await request(url, { cookie: root });
        assert.equal(response.status, 200, url);
        assert(!/"password"\s*:/.test(await response.text()), url);
      }
    });
    await t.test('roles are read fresh; logout, expiry and password changes revoke access', async () => {
      await prisma.user.update({ where: { id: admin.id }, data: { role: 'USER' } });
      assert.equal((await request('/api/users', { cookie: root })).status, 403);
      await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } });
      assert.equal((await request('/api/auth', { method: 'DELETE', cookie: a })).status, 200);
      assert.equal((await request('/api/tasks', { cookie: a })).status, 401);
      a = await login(alice, 'alice-test-only');
      await prisma.session.updateMany({ where: { userId: alice.id }, data: { expiresAt: new Date(0) } });
      assert.equal((await request('/api/tasks', { cookie: a })).status, 401);
      a = await login(alice, 'alice-test-only');
      assert.equal((await request(`/api/users/${alice.id}`, { method: 'PUT', cookie: a, body: { password: 'new-alice-test-only' } })).status, 200);
      assert.equal((await request('/api/tasks', { cookie: a })).status, 401);
      a = await login(alice, 'new-alice-test-only');
      assert.equal((await request('/api/tasks', { cookie: a })).status, 200);
    });
    console.log(`Checked ${routes.length} protected API handlers against anonymous access.`);
  } catch (error) {
    console.error(log);
    throw error;
  } finally {
    await prisma.$disconnect();
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F']);
    else server.kill('SIGTERM');
    // The isolated temporary database is retained for diagnosing test failures.
  }
});
