import { PrismaClient } from '@prisma/client';

// Add only the session table. Never synchronize or rebuild existing application tables on startup.
const prisma = new PrismaClient();
try {
  const users = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' AND name='User'");
  if (!users.length) throw new Error('User table missing: refusing to initialize an empty production database. Check DATABASE_URL and the volume.');
  await prisma.$transaction([
    prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "Session" ("tokenHash" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "expiresAt" DATETIME NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE)'),
    prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId")'),
    prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt")'),
  ]);
  await prisma.session.count(); // Fail startup if an incompatible table already exists.
  console.log('Session table ready; existing application tables were not modified.');
} finally {
  await prisma.$disconnect();
}
