// Persistent number registry: deliberately retained after deletion to prevent number reuse.
export const inventoryStatements = [
  `CREATE TABLE IF NOT EXISTS "InventoryLocation" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL COLLATE NOCASE UNIQUE)`,
  `INSERT OR IGNORE INTO "InventoryLocation" ("name") VALUES ('Holzwerkstatt'), ('Elektronikbereich'), ('Kreativraum'), ('Keller')`,
  `CREATE TABLE IF NOT EXISTS "InventoryPlacement" ("suggestionId" TEXT NOT NULL PRIMARY KEY, "locationId" INTEGER NOT NULL REFERENCES "InventoryLocation"("id"))`,
  `CREATE TABLE IF NOT EXISTS "InventoryCategory" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL COLLATE NOCASE UNIQUE)`,
  `CREATE TABLE IF NOT EXISTS "InventoryAssignment" ("suggestionId" TEXT NOT NULL PRIMARY KEY, "categoryId" INTEGER NOT NULL REFERENCES "InventoryCategory"("id"))`,
  `CREATE TABLE IF NOT EXISTS "InventoryNumber" ("number" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "suggestionId" TEXT NOT NULL UNIQUE)`,
  `INSERT INTO "InventoryNumber" ("suggestionId") SELECT "id" FROM "EquipmentSuggestion" WHERE "status" = 'PURCHASED' AND "id" NOT IN (SELECT "suggestionId" FROM "InventoryNumber") ORDER BY "createdAt", "id"`,
  `CREATE TRIGGER IF NOT EXISTS inventory_on_purchase AFTER UPDATE OF "status" ON "EquipmentSuggestion" WHEN NEW."status" = 'PURCHASED' AND NOT EXISTS (SELECT 1 FROM "InventoryNumber" WHERE "suggestionId" = NEW."id") BEGIN INSERT INTO "InventoryNumber" ("suggestionId") VALUES (NEW."id"); END`,
  `CREATE TRIGGER IF NOT EXISTS inventory_on_insert AFTER INSERT ON "EquipmentSuggestion" WHEN NEW."status" = 'PURCHASED' BEGIN INSERT OR IGNORE INTO "InventoryNumber" ("suggestionId") VALUES (NEW."id"); END`,
];
