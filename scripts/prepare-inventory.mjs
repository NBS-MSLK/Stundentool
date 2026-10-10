import { PrismaClient } from '@prisma/client';
import { inventoryStatements } from './inventory-schema.mjs';

const prisma = new PrismaClient();
try {
  await prisma.$transaction(async tx => {
    const existing = await tx.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' AND name='InventoryCategory'");
    for (const sql of inventoryStatements) await tx.$executeRawUnsafe(sql);
    if (!existing.length) {
      // One-time grouping; later restarts preserve manual assignments, including unassigned items.
      const items = await tx.$queryRawUnsafe(`SELECT s.id, c.title FROM EquipmentSuggestion s JOIN EquipmentCategory c ON c.id = s.categoryId WHERE s.status = 'PURCHASED'`);
      for (const item of items) {
        const name = item.title.replace(/^\s*\d+(?:\.\d+)*\.?\s*/, '').split(':')[0].trim() || 'Sonstiges';
        await tx.$executeRaw`INSERT OR IGNORE INTO InventoryCategory (name) VALUES (${name})`;
        const [category] = await tx.$queryRaw`SELECT id FROM InventoryCategory WHERE name = ${name} COLLATE NOCASE`;
        await tx.$executeRaw`INSERT OR IGNORE INTO InventoryAssignment (suggestionId, categoryId) VALUES (${item.id}, ${category.id})`;
      }
    }
  });
  const [{ count }] = await prisma.$queryRawUnsafe('SELECT COUNT(*) AS count FROM "InventoryNumber"');
  console.log(`Inventar vorbereitet: ${count} feste Inventarnummern vergeben.`);
} finally {
  await prisma.$disconnect();
}
