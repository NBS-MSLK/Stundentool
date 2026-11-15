import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  await prisma.$transaction([
    prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "Event" ("id" TEXT PRIMARY KEY NOT NULL, "title" TEXT NOT NULL, "date" TEXT NOT NULL, "time" TEXT NOT NULL, "location" TEXT NOT NULL DEFAULT \'\', "description" TEXT NOT NULL DEFAULT \'\', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)'),
    prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Event_date_time_idx" ON "Event"("date", "time")'),
  ]);
  console.log('Termine vorbereitet.');
} finally { await prisma.$disconnect(); }
