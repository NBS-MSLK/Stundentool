import { PrismaClient } from '@prisma/client';
import { splitTabletop } from './tabletop-categories.mjs';
import { splitSmallTools } from './small-tools-categories.mjs';
import { splitPresses } from './press-categories.mjs';

const prisma = new PrismaClient();
try {
  const count = await splitTabletop(prisma);
  console.log(count ? `Tabletop in ${count} Unterkategorien aufgeteilt.` : 'Tabletop: keine Umstellung erforderlich.');
  const toolsCount = await splitSmallTools(prisma);
  console.log(toolsCount ? `Feinwerkzeug in ${toolsCount} Unterkategorien aufgeteilt.` : 'Feinwerkzeug: keine Umstellung erforderlich.');
  const pressCount = await splitPresses(prisma);
  console.log(pressCount ? `EasyPress in ${pressCount} Unterkategorien aufgeteilt.` : 'EasyPress: keine Umstellung erforderlich.');
} finally { await prisma.$disconnect(); }
