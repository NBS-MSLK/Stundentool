import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    });

    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    await prisma.timeEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
