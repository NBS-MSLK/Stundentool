// Persistent number registry: deliberately retained after deletion to prevent number reuse.
export const inventoryStatements = [
  `CREATE TABLE IF NOT EXISTS "InventoryNumber" ("number" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "suggestionId" TEXT NOT NULL UNIQUE)`,
  `INSERT INTO "InventoryNumber" ("suggestionId") SELECT "id" FROM "EquipmentSuggestion" WHERE "status" = 'PURCHASED' AND "id" NOT IN (SELECT "suggestionId" FROM "InventoryNumber") ORDER BY "createdAt", "id"`,
  `CREATE TRIGGER IF NOT EXISTS inventory_on_purchase AFTER UPDATE OF "status" ON "EquipmentSuggestion" WHEN NEW."status" = 'PURCHASED' AND NOT EXISTS (SELECT 1 FROM "InventoryNumber" WHERE "suggestionId" = NEW."id") BEGIN INSERT INTO "InventoryNumber" ("suggestionId") VALUES (NEW."id"); END`,
  `CREATE TRIGGER IF NOT EXISTS inventory_on_insert AFTER INSERT ON "EquipmentSuggestion" WHEN NEW."status" = 'PURCHASED' BEGIN INSERT OR IGNORE INTO "InventoryNumber" ("suggestionId") VALUES (NEW."id"); END`,
];
