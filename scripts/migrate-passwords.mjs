import { PrismaClient } from '@prisma/client';
import { dirname, join } from 'node:path';
import { chmodSync } from 'node:fs';
import { hashPassword, verifyPassword } from '../src/lib/password.mjs';

const prisma = new PrismaClient();
try {
  const columns = await prisma.$queryRawUnsafe('PRAGMA table_info("User")');
  if (!columns.length) throw new Error('User table missing; refusing to initialize a new database.');
  const pending = await prisma.$queryRawUnsafe('SELECT COUNT(*) AS count FROM "User" WHERE "password" <> \'\'');
  const hasHashColumn = columns.some(c => c.name === 'passwordHash');
  if (!hasHashColumn || Number(pending[0].count) > 0) {
    // A last-moment snapshot on the same volume complements the independently downloaded backup.
    const databases = await prisma.$queryRawUnsafe('PRAGMA database_list');
    const database = databases.find(db => db.name === 'main');
    if (!database?.file) throw new Error('Cannot determine database path for safety backup.');
    const backup = join(dirname(database.file), 'before-password-migration-' + Date.now() + '.sqlite');
    await prisma.$executeRawUnsafe('VACUUM INTO ?', backup);
    chmodSync(backup, 0o600);
    console.log('Safety snapshot created before password migration.');
  }
  if (!hasHashColumn) await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT');
  const users = await prisma.user.findMany({ select: { id: true, password: true, passwordHash: true } });
  let migrated = 0;
  for (const user of users) {
    if (!user.password) continue;
    const passwordHash = await hashPassword(user.password);
    if (!(await verifyPassword(user.password, passwordHash))) throw new Error('Password verification failed; original credential retained.');
    // Both fields change atomically; the condition protects against concurrent password changes.
    const result = await prisma.user.updateMany({
      where: { id: user.id, password: user.password, passwordHash: user.passwordHash },
      data: { password: '', passwordHash },
    });
    if (result.count !== 1) throw new Error('Concurrent credential change detected. Restart migration.');
    migrated++;
  }
  const remaining = await prisma.user.count({ where: { password: { not: '' } } });
  if (remaining) throw new Error('Plaintext credentials remain; refusing to start.');
  console.log(`Password migration complete: ${migrated} credentials converted; no plaintext passwords remain in User.`);
} catch {
  console.error('Password migration failed; startup aborted. Original credentials or the safety snapshot are retained.');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
