import { PrismaClient } from '@prisma/client';
import { splitTabletop } from './tabletop-categories.mjs';

const prisma = new PrismaClient();
try {
  const count = await splitTabletop(prisma);
  console.log(count ? `Tabletop in ${count} Unterkategorien aufgeteilt.` : 'Tabletop: keine Umstellung erforderlich.');
} finally { await prisma.$disconnect(); }
