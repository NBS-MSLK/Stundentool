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
    const { startTime, endTime, isConfirmed, activity, isArchived, note } = await req.json();

    const dataToUpdate: any = {};
    if (startTime) dataToUpdate.startTime = new Date(startTime);
    if (endTime) dataToUpdate.endTime = new Date(endTime);
    if (typeof isConfirmed === 'boolean') dataToUpdate.isConfirmed = isConfirmed;
    if (typeof isArchived === 'boolean') dataToUpdate.isArchived = isArchived;
    if (activity !== undefined) dataToUpdate.activity = activity;
    if (note !== undefined) dataToUpdate.note = note;

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
