import { NextResponse } from 'next/server';
import { AccessError, secureRoute } from '@/lib/api-access';
import prisma from '@/lib/prisma';

async function handleGET() {
  const categories = await prisma.$queryRaw<{ id: number; name: string }[]>`SELECT id, name FROM InventoryCategory`;
  categories.sort((a, b) => a.name.localeCompare(b.name, 'de', { numeric: true }));
  const locations = await prisma.$queryRaw<{ id: number; name: string }[]>`SELECT id, name FROM InventoryLocation`;
  locations.sort((a, b) => a.name.localeCompare(b.name, 'de', { numeric: true }));
  const items = await prisma.$queryRaw`
    SELECT s.id, s.title, s.quantity, n.number AS inventoryNumber, a.categoryId, p.locationId
    FROM EquipmentSuggestion s JOIN InventoryNumber n ON n.suggestionId = s.id
    LEFT JOIN InventoryAssignment a ON a.suggestionId = s.id
    LEFT JOIN InventoryPlacement p ON p.suggestionId = s.id
    WHERE s.status = 'PURCHASED' ORDER BY n.number`;
  return NextResponse.json({ categories, locations, items });
}

async function handlePOST(request: Request) {
  const body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 100) throw new AccessError(400, 'Bitte einen Kategorienamen mit maximal 100 Zeichen eingeben.');
  // SQLite NOCASE also protects simultaneous requests against duplicate names.
  const count = await prisma.$executeRaw`INSERT OR IGNORE INTO InventoryCategory (name) VALUES (${name})`;
  if (!count) throw new AccessError(409, 'Diese Kategorie gibt es bereits.');
  return NextResponse.json({ success: true }, { status: 201 });
}

async function handlePUT(request: Request) {
  const body = await request.json();
  if (typeof body.id !== 'string') throw new AccessError(400, 'Ungültiger Inventareintrag.');
  if (body.inventoryNumber === undefined && body.categoryId === undefined && body.locationId === undefined) throw new AccessError(400, 'Keine Änderung angegeben.');
  if (body.locationId !== undefined && body.locationId !== null && (!Number.isSafeInteger(body.locationId) || body.locationId < 1)) throw new AccessError(400, 'Ungültiger Ort.');
  if (body.inventoryNumber !== undefined && (!Number.isSafeInteger(body.inventoryNumber) || body.inventoryNumber < 1 || body.inventoryNumber > 2147483647)) {
    throw new AccessError(400, 'Die Inventarnummer muss eine positive ganze Zahl sein (maximal 2147483647).');
  }
  if (body.categoryId !== undefined && body.categoryId !== null && (!Number.isSafeInteger(body.categoryId) || body.categoryId < 1)) throw new AccessError(400, 'Ungültige Kategorie.');
  await prisma.$transaction(async tx => {
    const item = await tx.equipmentSuggestion.findUnique({ where: { id: body.id } });
    if (!item || item.status !== 'PURCHASED') throw new AccessError(404, 'Inventareintrag nicht gefunden.');
    if (body.locationId === null) {
      await tx.$executeRaw`DELETE FROM InventoryPlacement WHERE suggestionId = ${body.id}`;
    } else if (body.locationId !== undefined) {
      const location = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM InventoryLocation WHERE id = ${body.locationId}`;
      if (!location.length) throw new AccessError(404, 'Ort nicht gefunden.');
      await tx.$executeRaw`INSERT INTO InventoryPlacement (suggestionId, locationId) VALUES (${body.id}, ${body.locationId}) ON CONFLICT(suggestionId) DO UPDATE SET locationId = excluded.locationId`;
    }
    if (body.inventoryNumber !== undefined) {
      // The primary key checks uniqueness atomically, including reserved numbers.
      const changed = await tx.$executeRaw`UPDATE OR IGNORE InventoryNumber SET number = ${body.inventoryNumber} WHERE suggestionId = ${body.id}`;
      if (!changed) throw new AccessError(409, 'Diese Inventarnummer ist bereits vergeben. Bitte eine andere Nummer wählen.');
      await tx.$executeRaw`UPDATE sqlite_sequence SET seq = MAX(seq, ${body.inventoryNumber}) WHERE name = 'InventoryNumber'`;
    }
    if (body.categoryId === null) {
      await tx.$executeRaw`DELETE FROM InventoryAssignment WHERE suggestionId = ${body.id}`;
    } else if (body.categoryId !== undefined) {
      const category = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM InventoryCategory WHERE id = ${body.categoryId}`;
      if (!category.length) throw new AccessError(404, 'Kategorie nicht gefunden.');
      await tx.$executeRaw`INSERT INTO InventoryAssignment (suggestionId, categoryId) VALUES (${body.id}, ${body.categoryId}) ON CONFLICT(suggestionId) DO UPDATE SET categoryId = excluded.categoryId`;
    }
  });
  return NextResponse.json({ success: true });
}

export const GET = secureRoute("/api/inventory", handleGET);
export const POST = secureRoute("/api/inventory", handlePOST);
export const PUT = secureRoute("/api/inventory", handlePUT);
