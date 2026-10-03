import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';
import { parseEntryTime, entryDurationError } from '@/lib/time-entry-validation';

async function handleGET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handlePUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const { startTime, endTime, isConfirmed, activity, isArchived, isSubmitted, note } = await req.json();

    const dataToUpdate: any = {};
    if (startTime !== undefined) {
      const parsed = parseEntryTime(startTime);
      if (!parsed) return NextResponse.json({ error: 'Bitte eine gültige Startzeit eingeben.' }, { status: 400 });
      dataToUpdate.startTime = parsed;
    }
    if (endTime !== undefined) {
      const parsed = parseEntryTime(endTime);
      if (!parsed) return NextResponse.json({ error: 'Bitte eine gültige Endzeit eingeben.' }, { status: 400 });
      dataToUpdate.endTime = parsed;
    }
    if (typeof isConfirmed === 'boolean') dataToUpdate.isConfirmed = isConfirmed;
    if (typeof isArchived === 'boolean') dataToUpdate.isArchived = isArchived;
    if (typeof isSubmitted === 'boolean') dataToUpdate.isSubmitted = isSubmitted;
    if (activity !== undefined) dataToUpdate.activity = activity;
    if (note !== undefined) dataToUpdate.note = note;

    const result = await prisma.$transaction(async tx => {
      const current = await tx.timeEntry.findUnique({ where: { id } });
      if (!current) return { error: 'Zeiteintrag nicht gefunden.', status: 404 };
      const finalStart = dataToUpdate.startTime ?? current.startTime;
      const finalEnd = dataToUpdate.endTime ?? current.endTime;
      if (finalEnd) {
        const error = entryDurationError(finalStart, finalEnd);
        if (error) return { error, status: 400 };
      } else {
        if (finalStart.getTime() > Date.now()) return { error: 'Ein laufender Timer darf nicht in der Zukunft starten.', status: 400 };
        if (isConfirmed === true) return { error: 'Bitte den Timer vor dem Bestätigen stoppen.', status: 400 };
      }
      const entry = await tx.timeEntry.update({ where: { id }, data: dataToUpdate, include: { user: true } });
      return { entry };
    });
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    const { entry } = result;

    if (isConfirmed === true && entry.endTime) {
      const diffMs = new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime();
      const hours = (diffMs / (1000 * 60 * 60)).toFixed(1);
      await logActivity(
        'TIME_ENTRY',
        `${entry.user.name} hat ${hours} Stunden bestätigt/eingetragen. (${entry.activity || 'Keine Aktivität angegeben'})`,
        entry.user.id,
        entry.user.name
      );
    } else if (isArchived === true) {
      await logActivity(
        'TIME_ARCHIVE',
        `Zeit-Eintrag von ${entry.user.name} wurde als geprüft archiviert.`,
        entry.user.id,
        entry.user.name
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handleDELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const entry = await prisma.timeEntry.findUnique({ where: { id }, include: { user: true } });
    if (entry) {
      await logActivity(
        'TIME_DELETE',
        `Zeit-Eintrag von ${entry.user.name} wurde gelöscht.`,
        entry.user.id,
        entry.user.name
      );
    }
    await prisma.timeEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export const GET = secureRoute("/api/entries/[id]", handleGET);
export const PUT = secureRoute("/api/entries/[id]", handlePUT);
export const DELETE = secureRoute("/api/entries/[id]", handleDELETE);
