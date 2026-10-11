import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { DatabaseSync } from 'node:sqlite';
import { splitTabletop, tabletopGroups } from '../scripts/tabletop-categories.mjs';
import { equipmentBudgetTotals } from '../src/lib/equipment-budget.ts';

test('Tabletop split preserves records, keeps cutter alternatives and runs only once', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabletop-test-'));
  const url = 'file:' + path.join(dir, 'test.sqlite').replaceAll('\\', '/');
  new DatabaseSync(path.join(dir, 'test.sqlite')).close();
  const init = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--skip-generate'], { env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8' });
  assert.equal(init.status, 0, init.stdout + init.stderr);
  const db = new PrismaClient({ datasources: { db: { url } } });
  try {
    const user = await db.user.create({ data: { name: 'Fixture' } });
    const source = await db.equipmentCategory.create({ data: { title: '24. Geländebau Tabletop', order: 24, creatorId: user.id } });
    const next = await db.equipmentCategory.create({ data: { title: '25. EasyPress', order: 25 } });
    for (const [title, ids] of tabletopGroups) for (const id of ids) await db.equipmentSuggestion.create({ data: { id, title, categoryId: source.id, creatorId: user.id, creatorName: user.name, price: 10, quantity: 2, votes: { create: { userId: user.id } }, notes: { create: { userId: user.id, userName: user.name, content: 'Keep' } }, materials: { create: { name: 'Accessory', quantity: 1, pricePerUnit: 3 } } } });
    const include = { votes: true, notes: true, materials: true };
    const before = await db.equipmentSuggestion.findMany({ include, orderBy: { id: 'asc' } });
    assert.equal(await splitTabletop(db), 11);
    const after = await db.equipmentSuggestion.findMany({ include, orderBy: { id: 'asc' } });
    const stable = rows => rows.map(({ categoryId, updatedAt, ...row }) => row);
    assert.deepEqual(stable(after), stable(before));
    const categories = await db.equipmentCategory.findMany({ include: { suggestions: { include: { materials: true, priorityVotes: true } } }, orderBy: { order: 'asc' } });
    assert.equal(categories[4].title, '24.5 Geländebau Tabletop: Heißdrahtschneider');
    assert.equal(categories[4].suggestions.length, 3);
    assert.equal(categories.at(-1).id, next.id);
    assert.equal(equipmentBudgetTotals(categories).plannedAmount, 11 * 23);
    assert.equal(await splitTabletop(db), 0);
    assert.deepEqual(await db.equipmentSuggestion.findMany({ include, orderBy: { id: 'asc' } }), after);
  } finally { await db.$disconnect(); }
});
