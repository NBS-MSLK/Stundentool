import { NextResponse } from 'next/server';
import { AccessError, secureRoute } from '@/lib/api-access';
import prisma from '@/lib/prisma';

async function handlePOST(request: Request) {
  const body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 100) throw new AccessError(400, 'Bitte einen Ortsnamen mit maximal 100 Zeichen eingeben.');
  await prisma.$transaction(async tx => {
    const duplicate = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM InventoryLocation WHERE name = ${name} COLLATE NOCASE`;
    if (duplicate.length) throw new AccessError(409, 'Diesen Ort gibt es bereits.');
    const count = await tx.$executeRaw`INSERT OR IGNORE INTO InventoryLocation (name) VALUES (${name})`;
    if (!count) throw new AccessError(409, 'Diesen Ort gibt es bereits.');
  });
  return NextResponse.json({ success: true }, { status: 201 });
}

export const POST = secureRoute("/api/inventory/locations", handlePOST);
