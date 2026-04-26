import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const { startTime, endTime, isConfirmed, activity, isArchived, isSubmitted, note } = await req.json();

    const dataToUpdate: any = {};
    if (startTime) dataToUpdate.startTime = new Date(startTime);
    if (endTime) dataToUpdate.endTime = new Date(endTime);
    if (typeof isConfirmed === 'boolean') dataToUpdate.isConfirmed = isConfirmed;
    if (typeof isArchived === 'boolean') dataToUpdate.isArchived = isArchived;
    if (typeof isSubmitted === 'boolean') dataToUpdate.isSubmitted = isSubmitted;
    if (activity !== undefined) dataToUpdate.activity = activity;
    if (note !== undefined) dataToUpdate.note = note;

    // Validation: 10 hour limit
    const finalStart = dataToUpdate.startTime || new Date((await prisma.timeEntry.findUnique({ where: { id }, select: { startTime: true } }))!.startTime);
    const finalEnd = dataToUpdate.endTime || (dataToUpdate.endTime === null ? null : new Date((await prisma.timeEntry.findUnique({ where: { id }, select: { endTime: true } }))?.endTime || Date.now()));
    
    if (finalEnd) {
      const diffMs = new Date(finalEnd).getTime() - new Date(finalStart).getTime();
      if (diffMs > 10 * 60 * 60 * 1000) {
        return NextResponse.json({ error: 'Maximal 10 Stunden pro Eintrag erlaubt.' }, { status: 400 });
      }
    }

    const entry = await prisma.timeEntry.update({
      where: { id },
      data: dataToUpdate,
      include: { user: true }
    });

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

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
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
