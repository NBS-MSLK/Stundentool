import { NextResponse } from 'next/server';
import { AccessError, secureRoute } from '@/lib/api-access';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

async function handlePOST(request: Request) {
  const body = await request.json();
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') throw new AccessError(403, 'Keine Berechtigung.');
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title || title.length > 200) throw new AccessError(400, 'Bitte eine Bezeichnung mit maximal 200 Zeichen eingeben.');
  if (typeof body.requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.requestId)) throw new AccessError(400, 'Ungültige Anfrage-ID.');
  if (!Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 100000) throw new AccessError(400, 'Bitte eine ganze Menge zwischen 1 und 100000 eingeben.');
  if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0 || body.price > 10000000 || Math.abs(body.price * 100 - Math.round(body.price * 100)) > 0.000001) throw new AccessError(400, 'Bitte einen gültigen Stückpreis mit höchstens zwei Nachkommastellen eingeben.');
  if (!Number.isSafeInteger(body.categoryId) || body.categoryId < 1) throw new AccessError(400, 'Bitte eine Inventarkategorie auswählen.');
  if (body.locationId !== null && (!Number.isSafeInteger(body.locationId) || body.locationId < 1)) throw new AccessError(400, 'Ungültiger Ort.');

  const item = await prisma.$transaction(async tx => {
    // Retrying the same form submission must not charge the budget twice.
    const existing = await tx.equipmentSuggestion.findUnique({ where: { id: body.requestId } });
    if (existing) return existing;
    const [category] = await tx.$queryRaw<{ id: number; name: string }[]>`SELECT id, name FROM InventoryCategory WHERE id = ${body.categoryId}`;
    if (!category) throw new AccessError(404, 'Kategorie nicht gefunden.');
    if (body.locationId !== null) {
      const locations = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM InventoryLocation WHERE id = ${body.locationId}`;
      if (!locations.length) throw new AccessError(404, 'Ort nicht gefunden.');
    }
    // A separate completed acquisition preserves existing proposals and their budget.
    const acquisition = await tx.equipmentCategory.create({ data: { title: `${category.name}: ${title}`, creatorId: session.user.id } });
    const created = await tx.equipmentSuggestion.create({ data: {
      id: body.requestId, title, quantity: body.quantity, price: body.price,
      status: 'PURCHASED', categoryId: acquisition.id,
      creatorId: session.user.id, creatorName: session.user.name,
    } });
    await tx.$executeRaw`INSERT INTO InventoryAssignment (suggestionId, categoryId) VALUES (${created.id}, ${category.id})`;
    if (body.locationId !== null) await tx.$executeRaw`INSERT INTO InventoryPlacement (suggestionId, locationId) VALUES (${created.id}, ${body.locationId})`;
    await tx.activityLog.create({ data: { userId: session.user.id, userName: session.user.name, action: 'Anschaffung nachgetragen', details: `${title}: ${body.quantity} Stück zu je ${body.price} €` } });
    return created;
  });
  return NextResponse.json({ id: item.id }, { status: 201 });
}

export const POST = secureRoute("/api/inventory/purchases", handlePOST);
