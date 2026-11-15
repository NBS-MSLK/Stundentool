import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  await prisma.$transaction(async tx => {
    await tx.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "Event" ("id" TEXT PRIMARY KEY NOT NULL, "title" TEXT NOT NULL, "date" TEXT NOT NULL, "time" TEXT NOT NULL, "location" TEXT NOT NULL DEFAULT \'\', "description" TEXT NOT NULL DEFAULT \'\', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)');
    const columns = await tx.$queryRawUnsafe('PRAGMA table_info("Event")');
    if (!columns.some(column => column.name === 'category')) {
      await tx.$executeRawUnsafe('ALTER TABLE "Event" ADD COLUMN "category" TEXT NOT NULL DEFAULT \'GENERAL\'');
    }
    await tx.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Event_date_time_idx" ON "Event"("date", "time")');
  });
  console.log('Termine vorbereitet.');
} finally { await prisma.$disconnect(); }
