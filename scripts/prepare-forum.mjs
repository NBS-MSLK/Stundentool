import {PrismaClient} from '@prisma/client';
const prisma=new PrismaClient();
try { await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
 await prisma.$transaction(async tx=>{
 await tx.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "ForumTopic" ("id" TEXT PRIMARY KEY NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL, "authorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE, "pdfKey" TEXT, "pdfName" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)');
 await tx.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "ForumComment" ("id" TEXT PRIMARY KEY NOT NULL, "topicId" TEXT NOT NULL REFERENCES "ForumTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE, "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE, "parentId" TEXT REFERENCES "ForumComment"("id") ON DELETE RESTRICT ON UPDATE CASCADE, "content" TEXT NOT NULL, "reference" TEXT, "hiddenAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)');
 await tx.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ForumComment_topicId_createdAt_idx" ON "ForumComment"("topicId", "createdAt")');
 await tx.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ForumComment_parentId_idx" ON "ForumComment"("parentId")');
 }); console.log('Forum vorbereitet.');
} finally {await prisma.$disconnect();}
