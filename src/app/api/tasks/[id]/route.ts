import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTaskNotification } from '@/lib/mailer';

export async function GET(request: Request, context: unknown) {
  const { id } = await (context as any).params;
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        steps: true,
        materials: true,
        volunteers: true,
        notes: true,
        subscribers: true,
        dateProposals: {
          include: { votes: true }
        }
      }
    });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: unknown) {
  const { id } = await (context as any).params;
  try {
    const oldTask = await prisma.task.findUnique({ where: { id } });
    const body = await request.json();
    const { status, title, description, imageUrl, estimatedHours, creatorIsContact, steps, materials, proposedDates } = body;
    // Anmerkung: Wir lesen dueDate aus dem Body nicht mehr ein, oder behalten es für die API bei, aber das Edit-Form sendet proposedDates

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (title) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl;
    if (estimatedHours !== undefined) dataToUpdate.estimatedHours = estimatedHours;
    if (creatorIsContact !== undefined) dataToUpdate.creatorIsContact = creatorIsContact;

    if (proposedDates) {
      dataToUpdate.dateProposals = {
        deleteMany: { id: { notIn: proposedDates.filter((p:any) => p.id).map((p:any) => p.id) } },
        update: proposedDates.filter((p:any) => p.id).map((p:any) => ({
          where: { id: p.id },
          data: { startTime: p.startTime, endTime: p.endTime }
        })),
        create: proposedDates.filter((p:any) => !p.id).map((p:any) => ({
          date: new Date(p.date), startTime: p.startTime, endTime: p.endTime
        }))
      };
    }

    if (steps) {
      dataToUpdate.steps = {
        deleteMany: { id: { notIn: steps.filter((s:any) => s.id).map((s:any) => s.id) } },
        update: steps.filter((s:any) => s.id).map((s:any) => ({
          where: { id: s.id },
          data: { description: s.description, estimatedHours: s.estimatedHours }
        })),
        create: steps.filter((s:any) => !s.id).map((s:any) => ({
          description: s.description, estimatedHours: s.estimatedHours
        }))
      };
    }

    if (materials) {
      dataToUpdate.materials = {
        deleteMany: { id: { notIn: materials.filter((m:any) => m.id).map((m:any) => m.id) } },
        update: materials.filter((m:any) => m.id).map((m:any) => ({
          where: { id: m.id },
          data: { name: m.name, buyLink: m.buyLink }
        })),
        create: materials.filter((m:any) => !m.id).map((m:any) => ({
          name: m.name, buyLink: m.buyLink
        }))
      };
    }

    const task = await prisma.task.update({
      where: { id },
      data: dataToUpdate,
      include: { steps: true, materials: true, volunteers: true, dateProposals: true, subscribers: true }
    });

    if (oldTask && status && oldTask.status !== status) {
      const statusLabels: any = { OPEN: 'Offen', IN_PROGRESS: 'In Arbeit', DONE: 'Erledigt', SCHEDULED: 'Terminiert' };
      const oldS = statusLabels[oldTask.status] || oldTask.status;
      const newS = statusLabels[status] || status;
      sendTaskNotification(
        task.id,
        `Update: ${task.title}`,
        `Der Status der Arbeit "${task.title}" hat sich geändert.\n\nVorher: ${oldS}\nJetzt: ${newS}`
      );
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: unknown) {
  const { id } = await (context as any).params;
  try {
    await prisma.task.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
