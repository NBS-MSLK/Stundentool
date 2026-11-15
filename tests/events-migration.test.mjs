import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

test('event startup migration is repeatable and preserves existing data', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'stundentool-events-'));
  const url = 'file:' + join(directory, 'test.sqlite').replaceAll('\\', '/');
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  const migrate = () => {
    const result = spawnSync(process.execPath, ['scripts/prepare-events.mjs'], { env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  };
  try {
    await prisma.$executeRawUnsafe('CREATE TABLE ExistingData (value TEXT)');
    await prisma.$executeRawUnsafe("INSERT INTO ExistingData VALUES ('preserved')");
    migrate();
    const event = await prisma.event.create({ data: { title: 'Werkstatt', date: '2027-04-01', time: '18:00' } });
    migrate();
    assert.deepEqual(await prisma.event.findUnique({ where: { id: event.id } }), event);
    assert.deepEqual(await prisma.$queryRawUnsafe('SELECT value FROM ExistingData'), [{ value: 'preserved' }]);
  } finally {
    await prisma.$disconnect();
    rmSync(directory, { recursive: true, force: true });
  }
});
