import { secureRoute, AccessError } from '@/lib/api-access';
import prisma from '@/lib/prisma';
import { isEventCategory } from '@/lib/event-categories';

export const dynamic = 'force-dynamic';

function eventData(body: Record<string, unknown>) {
  const field = (name: string, max: number, required = false) => {
    const value = body[name];
    if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) {
      throw new AccessError(400, 'Bitte Titel, Datum, Uhrzeit und Textlängen prüfen.');
    }
    return value.trim();
  };
  const title = field('title', 160, true);
  const date = field('date', 10, true);
  const time = field('time', 5, true);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new AccessError(400, 'Bitte ein gültiges Datum und eine gültige Uhrzeit angeben.');
  }
  const category = body.category ?? 'GENERAL';
  if (!isEventCategory(category)) throw new AccessError(400, 'Bitte eine gültige Terminart wählen.');
  return { title, date, time, category, location: field('location', 250), description: field('description', 5000) };
}

export const GET = secureRoute("/api/events", async () => {
  const events = await prisma.event.findMany({ orderBy: [{ date: 'asc' }, { time: 'asc' }] });
  return Response.json({ events });
});
export const POST = secureRoute("/api/events", async (request: Request) => {
  const event = await prisma.event.create({ data: eventData(await request.json()) });
  return Response.json({ event }, { status: 201 });
});
export const PUT = secureRoute("/api/events", async (request: Request) => {
  const body = await request.json();
  if (typeof body.id !== 'string') throw new AccessError(400, 'Ungültige Termin-ID.');
  const data = eventData(body);
  const result = await prisma.event.updateMany({ where: { id: body.id }, data });
  if (!result.count) throw new AccessError(404, 'Termin nicht gefunden.');
  return Response.json({ ok: true });
});
export const DELETE = secureRoute("/api/events", async (request: Request) => {
  const body = await request.json();
  if (typeof body.id !== 'string') throw new AccessError(400, 'Ungültige Termin-ID.');
  const result = await prisma.event.deleteMany({ where: { id: body.id } });
  if (!result.count) throw new AccessError(404, 'Termin nicht gefunden.');
  return Response.json({ ok: true });
});
