import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, context: unknown) {
  const { id } = await (context as any).params;
  try {
    const body = await request.json();
    const { stepId, isCompleted, estimatedHours } = body;

    if (!stepId) {
      return NextResponse.json({ error: 'Missing stepId' }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (isCompleted !== undefined) dataToUpdate.isCompleted = isCompleted;
    if (estimatedHours !== undefined) dataToUpdate.estimatedHours = estimatedHours === '' ? null : parseInt(estimatedHours);

    const step = await prisma.taskStep.update({
      where: { id: stepId },
      data: dataToUpdate
    });

    return NextResponse.json({ step });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
