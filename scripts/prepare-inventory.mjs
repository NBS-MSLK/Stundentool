import { PrismaClient } from '@prisma/client';
import { inventoryStatements } from './inventory-schema.mjs';

const prisma = new PrismaClient();
try {
  await prisma.$transaction(inventoryStatements.map(sql => prisma.$executeRawUnsafe(sql)));
  const [{ count }] = await prisma.$queryRawUnsafe('SELECT COUNT(*) AS count FROM "InventoryNumber"');
  console.log(`Inventar vorbereitet: ${count} feste Inventarnummern vergeben.`);
} finally {
  await prisma.$disconnect();
}
