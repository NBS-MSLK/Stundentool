import { NextResponse } from 'next/server';
import { AccessError, secureRoute } from '@/lib/api-access';
import prisma from '@/lib/prisma';

function categoryId(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) throw new AccessError(400, 'Ungültige Kategorie.');
  return value;
}

async function handlePUT(request: Request) {
  const body = await request.json();
  const id = categoryId(body.id);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 100) throw new AccessError(400, 'Bitte einen Kategorienamen mit maximal 100 Zeichen eingeben.');
  await prisma.$transaction(async tx => {
    const existing = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM InventoryCategory WHERE id = ${id}`;
    if (!existing.length) throw new AccessError(404, 'Kategorie nicht gefunden.');
    const duplicate = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM InventoryCategory WHERE name = ${name} COLLATE NOCASE AND id != ${id}`;
    if (duplicate.length) throw new AccessError(409, 'Diese Kategorie gibt es bereits.');
    const changed = await tx.$executeRaw`UPDATE OR IGNORE InventoryCategory SET name = ${name} WHERE id = ${id}`;
    if (!changed) throw new AccessError(409, 'Diese Kategorie gibt es bereits.');
  });
  return NextResponse.json({ success: true });
}

async function handleDELETE(request: Request) {
  const id = categoryId((await request.json()).id);
  await prisma.$transaction(async tx => {
    // Remove assignments only; equipment, inventory numbers and costs stay intact.
    await tx.$executeRaw`DELETE FROM InventoryAssignment WHERE categoryId = ${id}`;
    const deleted = await tx.$executeRaw`DELETE FROM InventoryCategory WHERE id = ${id}`;
    if (!deleted) throw new AccessError(404, 'Kategorie nicht gefunden.');
  });
  return NextResponse.json({ success: true });
}

export const PUT = secureRoute("/api/inventory/categories", handlePUT);
export const DELETE = secureRoute("/api/inventory/categories", handleDELETE);
