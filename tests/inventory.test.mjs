import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { inventoryStatements } from '../scripts/inventory-schema.mjs';
import { equipmentBudgetTotals } from '../src/lib/equipment-budget.ts';

test('backfill and status changes assign stable numbers without duplicates or reuse', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`CREATE TABLE EquipmentSuggestion (id TEXT PRIMARY KEY, status TEXT, createdAt TEXT);
      INSERT INTO EquipmentSuggestion VALUES ('old', 'PURCHASED', '2020'), ('new', 'PROPOSED', '2021');`);
    for (const sql of inventoryStatements) db.exec(sql);
    for (const sql of inventoryStatements) db.exec(sql);
    assert.equal(db.prepare('SELECT count(*) AS count FROM InventoryNumber').get().count, 1);
    db.exec(`UPDATE EquipmentSuggestion SET status = 'PURCHASED' WHERE id = 'new'`);
    const original = db.prepare("SELECT number FROM InventoryNumber WHERE suggestionId = 'new'").get().number;
    db.exec(`UPDATE EquipmentSuggestion SET status = 'PROPOSED' WHERE id = 'new'; UPDATE EquipmentSuggestion SET status = 'PURCHASED' WHERE id = 'new'`);
    assert.equal(db.prepare("SELECT number FROM InventoryNumber WHERE suggestionId = 'new'").get().number, original);
    db.exec(`DELETE FROM EquipmentSuggestion WHERE id = 'new'; INSERT INTO EquipmentSuggestion VALUES ('later', 'PURCHASED', '2022')`);
    assert.ok(db.prepare("SELECT number FROM InventoryNumber WHERE suggestionId = 'later'").get().number > original);
  } finally { db.close(); }
});

test('inventory remains in budget, including quantities and accessories', () => {
  const item = (status, price, quantity = 1, extra = {}) => ({ status, price, quantity, ...extra });
  const totals = equipmentBudgetTotals([
    { suggestions: [item('PURCHASED', 100, 2, { materials: [{ quantity: 3, pricePerUnit: 10 }] }), item('REJECTED', 999)] },
    { suggestions: [item('REJECTED', 900), item('PROPOSED', 50, 2)] },
    { suggestions: [item('PURCHASED', 20), item('PURCHASED', 30)] },
  ]);
  assert.deepEqual(totals, { spentAmount: 280, plannedAmount: 380 });
});
