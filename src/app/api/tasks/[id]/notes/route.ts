import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTaskNotification } from '@/lib/mailer';

export async function POST(request: Request, context: unknown) {
  const { id } = await (context as any).params;
  
  try {
    const body = await request.json();
    const { userId, userName, content } = body;

    if (!userId || !userName || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingNote = await prisma.taskNote.findUnique({
      where: { taskId_userId: { taskId: id, userId } }
    });

    // Upsert note (create if not exists, update if exists)
    const note = await prisma.taskNote.upsert({
      where: {
        taskId_userId: { taskId: id, userId }
      },
      update: { content },
      create: { taskId: id, userId, userName, content }
    });

    if (!existingNote) {
      const task = await prisma.task.findUnique({ where: { id } });
      if (task) {
        sendTaskNotification(
          task.id,
          `Neue Anmerkung: ${task.title}`,
          `Es gibt eine neue Anmerkung von ${userName} zur Arbeit "${task.title}":\n\n"${content}"`
        );
      }
    }

    return NextResponse.json({ note });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
