import test from 'node:test';
import { verifyPassword } from '../src/lib/password.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { DatabaseSync } from 'node:sqlite';
import { PrismaClient } from '@prisma/client';
import { inventoryStatements } from '../scripts/inventory-schema.mjs';

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
  for (const sql of inventoryStatements) await prisma.$executeRawUnsafe(sql);
  const admin = await prisma.user.create({ data: { name: 'Test Admin', password: 'admin-test-only', role: 'ADMIN' } });
  const alice = await prisma.user.create({ data: { name: 'Test Alice', password: 'alice-test-only' } });
  const bob = await prisma.user.create({ data: { name: 'Test Bob', password: 'bob-test-only' } });
  const blank = await prisma.user.create({ data: { name: 'Test Unactivated' } });
  const named = await prisma.user.create({ data: { name: 'Nils Beinke-Schulte', password: 'named-test-only', role: 'USER' } });
  const entry = await prisma.timeEntry.create({ data: { userId: bob.id, startTime: new Date(Date.now() - 3600000), endTime: new Date(), isConfirmed: true } });
  const aliceEntry = await prisma.timeEntry.create({ data: { userId: alice.id, startTime: new Date(Date.now() - 3600000), endTime: new Date() } });
  const task = await prisma.task.create({ data: { title: 'Bob task', creatorId: bob.id, creatorName: bob.name, steps: { create: { description: 'Step' } }, materials: { create: { name: 'Material' } } }, include: { steps: true, materials: true } });
  const aliceTask = await prisma.task.create({ data: { title: 'Alice task', creatorId: alice.id, creatorName: alice.name } });
  const category = await prisma.equipmentCategory.create({ data: { title: 'Bob category', creatorId: bob.id } });
  const suggestion = await prisma.equipmentSuggestion.create({ data: { categoryId: category.id, title: 'Bob suggestion', creatorId: bob.id, creatorName: bob.name, materials: { create: { name: 'Material' } } }, include: { materials: true } });
  const migration = spawnSync(process.execPath, ['scripts/migrate-passwords.mjs'], { env, encoding: 'utf8' });
  assert.equal(migration.status, 0, migration.stdout + migration.stderr);
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
    assert(!('passwordHash' in data.user));
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

    await t.test('locations are preset without assigning items and only admins may add or assign them', async () => {
      const data = await (await request('/api/inventory', { cookie: root })).json();
      assert.deepEqual(data.locations.map(location => location.name).sort(), ['Holzwerkstatt', 'Elektronikbereich', 'Kreativraum', 'Keller'].sort());
      assert.ok(data.items.every(item => item.locationId === null));
      const locationId = data.locations[0].id;
      assert.equal((await request('/api/inventory/locations', { method: 'POST', cookie: a, body: { name: 'Lager' } })).status, 403);
      assert.equal((await request('/api/inventory/locations', { method: 'POST', cookie: root, body: { name: 'Lager' } })).status, 201);
      assert.equal((await request('/api/inventory/locations', { method: 'POST', cookie: root, body: { name: ' lager ' } })).status, 409);
      await prisma.equipmentSuggestion.update({ where: { id: suggestion.id }, data: { status: 'PURCHASED' } });
      const before = await prisma.equipmentSuggestion.findUnique({ where: { id: suggestion.id } });
      for (const cookie of [a, b]) assert.equal((await request('/api/inventory', { method: 'PUT', cookie, body: { id: suggestion.id, locationId } })).status, 403);
      assert.equal((await request('/api/inventory', { method: 'PUT', cookie: root, body: { id: suggestion.id, locationId: 999999 } })).status, 404);
      assert.equal((await request('/api/inventory', { method: 'PUT', cookie: root, body: { id: suggestion.id, locationId } })).status, 200);
      const assigned = await (await request('/api/inventory', { cookie: a })).json();
      assert.equal(assigned.items.find(item => item.id === suggestion.id).locationId, locationId);
      assert.deepEqual(await prisma.equipmentSuggestion.findUnique({ where: { id: suggestion.id } }), before);
      assert.equal((await request('/api/inventory', { method: 'PUT', cookie: root, body: { id: suggestion.id, locationId: null } })).status, 200);
    });

    await t.test('inventory numbers reject duplicates and categories can be created and assigned by admins', async () => {
      assert.equal((await request('/api/inventory', { method: 'POST', cookie: a, body: { name: 'Forbidden' } })).status, 403);
      assert.equal((await request('/api/inventory', { method: 'POST', cookie: root, body: { name: 'Holzwerkstatt' } })).status, 201);
      assert.equal((await request('/api/inventory', { method: 'POST', cookie: root, body: { name: 'Holzwerkstatt' } })).status, 409);
      await prisma.equipmentSuggestion.update({ where: { id: suggestion.id }, data: { status: 'PURCHASED' } });
      const another = await prisma.equipmentSuggestion.create({ data: { categoryId: category.id, title: 'Second', creatorId: bob.id, creatorName: bob.name, status: 'PURCHASED' } });
      const data = await (await request('/api/inventory', { cookie: root })).json();
      const number = data.items.find(item => item.id === another.id).inventoryNumber;
      const categoryId = data.categories[0].id;
      // Even the item's creator cannot move it or clear its category.
      for (const cookie of [a, b]) {
        for (const target of [categoryId, null]) {
          assert.equal((await request('/api/inventory', { method: 'PUT', cookie, body: { id: suggestion.id, categoryId: target } })).status, 403);
        }
      }
      const unchanged = await (await request('/api/inventory', { cookie: root })).json();
      assert.equal(unchanged.items.find(item => item.id === suggestion.id).categoryId, null);
      assert.equal((await request('/api/inventory', { method: 'PUT', cookie: a, body: { id: suggestion.id, inventoryNumber: 42 } })).status, 403);
      assert.equal((await request('/api/inventory', { method: 'PUT', cookie: root, body: { id: suggestion.id, inventoryNumber: number } })).status, 409);
      assert.equal((await request('/api/inventory', { method: 'PUT', cookie: root, body: { id: suggestion.id, inventoryNumber: -1 } })).status, 400);
      assert.equal((await request('/api/inventory', { method: 'PUT', cookie: root, body: { id: suggestion.id, inventoryNumber: 42, categoryId } })).status, 200);
      const updated = await (await request('/api/inventory', { cookie: root })).json();
      assert.equal(updated.items.find(item => item.id === suggestion.id).inventoryNumber, 42);
      assert.equal(updated.items.find(item => item.id === suggestion.id).categoryId, categoryId);
      assert.equal((await request('/api/inventory', { method: 'PUT', cookie: root, body: { id: suggestion.id, categoryId: null } })).status, 200);
    });

    await t.test('inventory category management blocks unauthorized access and preserves inventory on deletion', async () => {
      const url = '/api/inventory/categories';
      const initial = await (await request('/api/inventory', { cookie: root })).json();
      const id = initial.categories[0].id;
      for (const method of ['PUT', 'DELETE']) {
        assert.equal((await request(url, { method, cookie: a, body: { id, name: 'Unauthorized' } })).status, 403);
        assert.equal((await request(url, { method, cookie: root, origin: 'https://attacker.example', body: { id, name: 'CSRF' } })).status, 403);
        assert.equal((await request(url, { method, cookie: root, body: { id: '1 OR 1=1', name: 'Invalid' } })).status, 400);
        assert.equal((await request(url, { method, cookie: root, body: { id: 999999, name: 'Missing' } })).status, 404);
      }
      assert.equal((await request('/api/inventory', { method: 'POST', cookie: root, body: { name: 'Elektronik' } })).status, 201);
      assert.equal((await request(url, { method: 'PUT', cookie: root, body: { id, name: 'elektronik' } })).status, 409);
      assert.equal((await request(url, { method: 'PUT', cookie: root, body: { id, name: '   ' } })).status, 400);
      const name = "Holz & Metall'; DROP TABLE InventoryNumber; --";
      assert.equal((await request(url, { method: 'PUT', cookie: root, body: { id, name } })).status, 200);
      assert.equal((await request('/api/inventory', { method: 'PUT', cookie: root, body: { id: suggestion.id, categoryId: id } })).status, 200);
      const renamed = await (await request('/api/inventory', { cookie: root })).json();
      assert.equal(renamed.categories.find(category => category.id === id).name, name);
      const before = await prisma.equipmentSuggestion.findUnique({ where: { id: suggestion.id }, include: { materials: true } });
      assert.equal((await request(url, { method: 'DELETE', cookie: root, body: { id } })).status, 200);
      const after = await (await request('/api/inventory', { cookie: root })).json();
      assert.equal(after.categories.some(category => category.id === id), false);
      assert.equal(after.items.find(item => item.id === suggestion.id).categoryId, null);
      assert.equal(after.items.find(item => item.id === suggestion.id).inventoryNumber, 42);
      assert.deepEqual(await prisma.equipmentSuggestion.findUnique({ where: { id: suggestion.id }, include: { materials: true } }), before);
    });

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
        assert(!/"password(?:Hash)?"\s*:/.test(await response.text()), url);
      }
    });
    await t.test('removed mail subscriptions expose no subscriber profiles and preserve stored settings', async () => {
      await prisma.user.update({ where: { id: bob.id }, data: { email: 'private@example.invalid', emailPref: 'SPECIFIC' } });
      await prisma.task.update({ where: { id: task.id }, data: { subscribers: { connect: { id: bob.id } } } });
      const response = await request('/api/tasks/' + task.id, { cookie: a });
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert(!Object.hasOwn(payload.task, 'subscribers'));
      assert(!JSON.stringify(payload).includes('private@example.invalid'));
      assert.equal((await request('/api/tasks/' + task.id + '/subscribe', { cookie: b, method: 'POST', body: { userId: bob.id, subscribe: false } })).status, 404);
      assert.equal((await request('/api/users/' + bob.id, { cookie: b, method: 'PUT', body: { emailPref: 'ALL' } })).status, 400);
      const stored = await prisma.user.findUnique({ where: { id: bob.id }, include: { subscribedTasks: true } });
      assert.equal(stored.email, 'private@example.invalid');
      assert.equal(stored.emailPref, 'SPECIFIC');
      assert(stored.subscribedTasks.some(item => item.id === task.id));
    });
    await t.test('new users store hashes and administrators can reset passwords', async () => {
      const created = await request('/api/users', { method: 'POST', cookie: root, body: { name: 'New member', password: 'new-member-test-only' } });
      assert.equal(created.status, 200);
      const { user } = await created.json();
      assert(!('passwordHash' in user));
      const stored = await prisma.user.findUnique({ where: { id: user.id } });
      assert.equal(stored.password, '');
      assert(await verifyPassword('new-member-test-only', stored.passwordHash));
      const memberCookie = await login(user, 'new-member-test-only');
      const reset = await request('/api/users/' + user.id, { method: 'PUT', cookie: root, body: { password: 'reset-test-only' } });
      assert.equal(reset.status, 200);
      assert.equal((await request('/api/tasks', { cookie: memberCookie })).status, 401);
      await login(user, 'reset-test-only');
    });
    await t.test('polls keep confidential voters private and show named voters, with changeable selections', async () => {
      for (const isAnonymous of [true, false]) {
        const poll = await prisma.poll.create({ data: { question: 'Privacy test', isAnonymous, options: { create: [{ text: 'A' }, { text: 'B' }] } }, include: { options: true } });
        const [first, second] = poll.options;
        await prisma.pollVote.create({ data: { pollId: poll.id, optionId: first.id, userId: bob.id, userName: bob.name } });
        async function read(cookie) {
          const response = await request('/api/polls', { cookie });
          assert.equal(response.status, 200);
          const payload = await response.json();
          const result = payload.polls.find(item => item.id === poll.id);
          const encoded = JSON.stringify(result);
          assert(!/"(?:userId|userName|votes|createdAtVote)"\s*:/.test(encoded));
          assert(!encoded.includes(bob.id));
          if (isAnonymous) {
            assert(!encoded.includes(bob.name));
            assert(result.options.every(option => !Object.hasOwn(option, 'voterNames')));
          } else {
            assert.deepEqual(result.options.find(option => option.id === first.id).voterNames, [bob.name]);
          }
          return result;
        }
        assert.equal((await read(root)).myOptionId, null);
        assert.equal((await read(a)).totalVotes, 1);
        assert.equal((await read(b)).myOptionId, first.id);
        let response = await request('/api/polls/' + poll.id + '/vote', { cookie: a, method: 'POST', body: { optionId: first.id } });
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { myOptionId: first.id });
        response = await request('/api/polls/' + poll.id + '/vote', { cookie: a, method: 'POST', body: { optionId: second.id } });
        assert.equal(response.status, 200);
        const updated = await read(a);
        assert.equal(updated.myOptionId, second.id);
        assert.equal(updated.totalVotes, 2);
        assert.deepEqual(updated.options.map(o => o.voteCount).sort(), [1, 1]);
        if (!isAnonymous) {
          for (const cookie of [root, a, b]) {
            const named = await read(cookie);
            assert.deepEqual(named.options.find(option => option.id === second.id).voterNames, [alice.name]);
          }
        }
        assert.equal((await read(root)).myOptionId, null);
        assert.equal(await prisma.pollVote.count({ where: { pollId: poll.id, userId: alice.id } }), 1);
        assert.equal((await request('/api/polls/' + poll.id, { cookie: root, method: 'PUT', body: { votes: { deleteMany: {} } } })).status, 400);
        assert.equal((await request('/api/polls/' + poll.id, { cookie: root, method: 'PUT', body: { isAnonymous: !isAnonymous } })).status, 400);
        assert.equal((await request('/api/polls/' + poll.id + '/vote', { cookie: a, method: 'POST', body: { optionId: 'wrong-poll-option' } })).status, 400);
        assert.equal((await request('/api/polls/' + poll.id, { cookie: root, method: 'PUT', body: { isActive: false } })).status, 200);
        assert.equal((await request('/api/polls/' + poll.id + '/vote', { cookie: a, method: 'POST', body: { optionId: first.id } })).status, 409);
        const closed = await read(root);
        assert.equal(closed.totalVotes, 2);
      }
    });
    await t.test('time entries reject invalid dates and durations without changing data', async () => {
      const user = await prisma.user.create({ data: { name: 'Time validation test' } });
      const startTime = '2026-01-01T10:00:00.000Z';
      const endTime = '2026-01-01T11:00:00.000Z';
      const saved = await prisma.timeEntry.create({ data: { userId: user.id, startTime, endTime } });
      const url = '/api/entries/' + saved.id;
      for (const invalid of ['not-a-date', '', null, 123, true, {}, [], '2026-02-30T10:00:00Z', '2026-01-01T24:00:00Z']) {
        for (const field of ['startTime', 'endTime']) {
          assert.equal((await request('/api/entries', { cookie: root, method: 'POST', body: { userId: user.id, startTime, endTime, [field]: invalid } })).status, 400);
          assert.equal((await request(url, { cookie: root, method: 'PUT', body: { [field]: invalid } })).status, 400);
        }
      }
      for (const end of [startTime, '2026-01-01T09:00:00Z', '2026-01-01T20:00:00.001Z']) {
        assert.equal((await request('/api/entries', { cookie: root, method: 'POST', body: { userId: user.id, startTime, endTime: end } })).status, 400);
        assert.equal((await request(url, { cookie: root, method: 'PUT', body: { endTime: end } })).status, 400);
      }
      // Validate a partial edit against the unchanged other endpoint too.
      assert.equal((await request(url, { cookie: root, method: 'PUT', body: { startTime: endTime } })).status, 400);
      assert.deepEqual(await prisma.timeEntry.findUnique({ where: { id: saved.id } }), saved);
      assert.equal(await prisma.timeEntry.count({ where: { userId: user.id } }), 1);
      for (const [start, end] of [
        [startTime, '2026-01-01T20:00:00Z'],
        ['2026-01-01T23:00:00Z', '2026-01-02T01:00:00Z'],
        ['2026-03-29T01:30:00+01:00', '2026-03-29T03:30:00+02:00'],
      ]) {
        assert.equal((await request('/api/entries', { cookie: root, method: 'POST', body: { userId: user.id, startTime: start, endTime: end } })).status, 200);
        assert.equal((await request(url, { cookie: root, method: 'PUT', body: { startTime: start, endTime: end } })).status, 200);
      }
      // Old running timers can still be edited and stopped with the existing six-hour cap.
      const timer = await prisma.timeEntry.create({ data: { userId: user.id, startTime: new Date(Date.now() - 12 * 3600000) } });
      const timerUrl = '/api/entries/' + timer.id;
      assert.equal((await request(timerUrl, { cookie: root, method: 'PUT', body: { note: 'Still running' } })).status, 200);
      assert.equal((await request(timerUrl, { cookie: root, method: 'PUT', body: { isConfirmed: true } })).status, 400);
      assert.equal((await request(timerUrl, { cookie: root, method: 'PUT', body: { startTime: new Date(Date.now() + 3600000).toISOString() } })).status, 400);
      const stopped = await request('/api/entries/stop', { cookie: root, method: 'POST', body: { userId: user.id } });
      assert.equal(stopped.status, 200);
      const stoppedEntry = (await stopped.json()).entry;
      assert.equal(new Date(stoppedEntry.endTime) - new Date(stoppedEntry.startTime), 6 * 3600000);
      const future = await prisma.timeEntry.create({ data: { userId: user.id, startTime: new Date(Date.now() + 3600000) } });
      assert.equal((await request('/api/entries/stop', { cookie: root, method: 'POST', body: { userId: user.id } })).status, 400);
      assert.deepEqual(await prisma.timeEntry.findUnique({ where: { id: future.id } }), future);
    });
    await t.test('failed user deletion preserves entries and related records; successful deletion is atomic', async () => {
      for (const kind of ['task', 'newsPost', 'headline', 'equipmentSuggestion']) {
        const user = await prisma.user.create({ data: { name: 'Deletion test ' + kind } });
        const entry = await prisma.timeEntry.create({ data: { userId: user.id, startTime: new Date(), note: 'Keep this entry' } });
        const data = {
          task: { title: 'Keep task', creatorId: user.id, creatorName: user.name },
          newsPost: { title: 'Keep post', content: 'Keep content', authorId: user.id },
          headline: { content: 'Keep headline', authorId: user.id },
          equipmentSuggestion: { title: 'Keep suggestion', categoryId: category.id, creatorId: user.id, creatorName: user.name },
        }[kind];
        const related = await prisma[kind].create({ data });
        const response = await request('/api/users/' + user.id, { cookie: root, method: 'DELETE' });
        assert.equal(response.status, 409);
        assert.match((await response.json()).error, /keine Daten gelöscht/);
        assert.deepEqual(await prisma.timeEntry.findUnique({ where: { id: entry.id } }), entry);
        assert.deepEqual(await prisma.user.findUnique({ where: { id: user.id } }), user);
        assert.deepEqual(await prisma[kind].findUnique({ where: { id: related.id } }), related);
      }
      const user = await prisma.user.create({ data: { name: 'Deletable test user' } });
      await prisma.timeEntry.create({ data: { userId: user.id, startTime: new Date() } });
      await prisma.session.create({ data: { userId: user.id, tokenHash: 'deletion-test-session', expiresAt: new Date(Date.now() + 60000) } });
      assert.equal((await request('/api/users/' + user.id, { cookie: root, method: 'DELETE' })).status, 200);
      assert.equal(await prisma.user.findUnique({ where: { id: user.id } }), null);
      assert.equal(await prisma.timeEntry.count({ where: { userId: user.id } }), 0);
      assert.equal(await prisma.session.count({ where: { userId: user.id } }), 0);
      assert.equal((await request('/api/users/' + user.id, { cookie: root, method: 'DELETE' })).status, 404);
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
      const changed = await prisma.user.findUnique({ where: { id: alice.id } });
      assert.equal(changed.password, '');
      assert(await verifyPassword('new-alice-test-only', changed.passwordHash));
      a = await login(alice, 'new-alice-test-only');
      assert.equal((await request('/api/tasks', { cookie: a })).status, 200);
    });
    await t.test('repeated failed logins are throttled', async () => {
      for (let i = 0; i < 20; i++) {
        assert.equal((await request('/api/auth', { method: 'POST', body: { name: 'Missing account', password: 'wrong' } })).status, 401);
      }
      assert.equal((await request('/api/auth', { method: 'POST', body: { name: 'Missing account', password: 'wrong' } })).status, 429);
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
