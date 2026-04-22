import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTaskNotification } from '@/lib/mailer';

export async function PUT(request: Request, context: unknown) {
  const { id } = await (context as any).params;
  try {
    const body = await request.json();
    const { stepId, isCompleted, estimatedHours, userRole, userName } = body;

    if (!stepId) {
      return NextResponse.json({ error: 'Missing stepId' }, { status: 400 });
    }

    const oldStep = await prisma.taskStep.findUnique({ where: { id: stepId }, include: { task: true } });

    const dataToUpdate: any = {};
    if (isCompleted !== undefined) dataToUpdate.isCompleted = isCompleted;
    if (estimatedHours !== undefined) dataToUpdate.estimatedHours = estimatedHours === '' ? null : parseInt(estimatedHours);

    const step = await prisma.taskStep.update({
      where: { id: stepId },
      data: dataToUpdate
    });

    if (oldStep && isCompleted !== undefined && isCompleted !== oldStep.isCompleted && userRole === 'ADMIN') {
      const task = oldStep.task;
      const statusText = isCompleted ? 'erledigt' : 'als noch offen markiert';
      sendTaskNotification(
        task.id,
        `Schritt aktualisiert: ${task.title}`,
        `Der Teilschritt "${oldStep.description}" der Arbeit "${task.title}" wurde ${statusText}.`
      );
    }

    return NextResponse.json({ step });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
