import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';
import { parseEntryTime, entryDurationError } from '@/lib/time-entry-validation';

async function handleGET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const all = searchParams.get('all');
  const showArchived = searchParams.get('archived') === 'true';

  try {
    if (all === 'true') {
      const entries = await prisma.timeEntry.findMany({
        where: showArchived ? undefined : { isArchived: false },
        include: { user: true },
        orderBy: { startTime: 'asc' },
      });
      return NextResponse.json({ entries });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const entries = await prisma.timeEntry.findMany({
      where: showArchived ? { userId } : { userId, isArchived: false },
      orderBy: { startTime: 'desc' },
    });
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handlePOST(req: Request) {
  try {
    const { userId, startTime, endTime, activity, note } = await req.json();

    if (!userId || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const start = parseEntryTime(startTime);
    const end = parseEntryTime(endTime);
    if (!start || !end) return NextResponse.json({ error: 'Bitte gültige Zeitangaben eingeben.' }, { status: 400 });
    const durationError = entryDurationError(start, end);
    if (durationError) return NextResponse.json({ error: durationError }, { status: 400 });
    const diffMs = end.getTime() - start.getTime();

    const entry = await prisma.timeEntry.create({
      data: {
        userId,
        startTime: start,
        endTime: end,
        activity,
        isConfirmed: true, // Manual entries are confirmed by default or by admin
        isManualEntry: true,
        note
      },
      include: { user: true }
    });

    const hours = (diffMs / (1000 * 60 * 60)).toFixed(1);
    await logActivity(
      'TIME_ENTRY',
      `${entry.user.name} hat ${hours} Stunden eingetragen. (${activity || 'Keine Aktivität angegeben'})`,
      userId,
      entry.user.name
    );

    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export const GET = secureRoute("/api/entries", handleGET);
export const POST = secureRoute("/api/entries", handlePOST);
