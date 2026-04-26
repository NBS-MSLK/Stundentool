import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTaskNotification } from '@/lib/mailer';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    const tasks = await prisma.task.findMany({
      where: status ? { status } : undefined,
      include: {
        steps: true,
        materials: true,
        volunteers: true,
        creator: { select: { name: true } },
        dateProposals: {
          include: { votes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, creatorId, creatorName, imageUrl, videos, estimatedHours, creatorIsContact, proposedDates, steps, materials } = body;

    if (!title || !creatorId || !creatorName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (proposedDates && proposedDates.length > 0) {
      const now = new Date();
      for (const p of proposedDates) {
        const pd = new Date(`${p.date}T${p.startTime || '08:00'}`);
        const diffMs = pd.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < 24) {
          return NextResponse.json({ error: 'Terminvorschläge sollten 24h Vorlaufzeit haben' }, { status: 400 });
        }
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        creatorId,
        creatorName,
        imageUrl,
        estimatedHours: estimatedHours ? parseInt(estimatedHours) : null,
        creatorIsContact: creatorIsContact !== undefined ? creatorIsContact : true,
        videos: videos && videos.length > 0 ? {
          create: videos.map((v: any) => ({ url: v.url, description: v.description }))
        } : undefined,
        steps: steps && steps.length > 0 ? {
          create: steps.map((s: any) => ({ 
            description: s.description, 
            estimatedHours: s.estimatedHours ? parseInt(s.estimatedHours) : null 
          }))
        } : undefined,
        materials: materials && materials.length > 0 ? {
          create: materials.map((m: any) => ({ name: m.name, buyLink: m.buyLink }))
        } : undefined,
        dateProposals: proposedDates && proposedDates.length > 0 ? {
          create: proposedDates.map((p: any) => ({
            date: new Date(p.date),
            startTime: p.startTime || '08:00',
            endTime: p.endTime || '09:00'
          }))
        } : undefined,
      },
      include: {
        steps: true,
        materials: true,
        dateProposals: true
      }
    });
    
    // Automatically add the creator as volunteer if creatorIsContact
    if (creatorIsContact) {
      await prisma.taskVolunteer.create({
        data: {
          taskId: task.id,
          userId: creatorId,
          userName: creatorName,
          role: 'CONTACT'
        }
      });
    }

    let mailText = `Hallo,\n\nes wurde ein neuer Arbeitsdienst eingetragen: "${task.title}".\n\nErsteller: ${task.creatorName}`;
    
    if (task.dateProposals && task.dateProposals.length > 0) {
      mailText += `\n\nTerminvorschläge:`;
      task.dateProposals.forEach((p: any) => {
        mailText += `\n- ${new Date(p.date).toLocaleDateString('de-DE')} (${p.startTime} - ${p.endTime} Uhr)`;
      });
      mailText += `\n\nBitte stimme im Dashboard ab!`;
    } else {
      mailText += `\n\nSchau dir die Details direkt im Stundentool an!`;
    }

    sendTaskNotification(
      task.id,
      `Neuer Arbeitsdienst: ${task.title}`,
      mailText
    ).catch(console.error);

    await logActivity(
      'TASK_CREATE',
      `${task.creatorName} hat den Arbeitsdienst "${task.title}" erstellt.`,
      creatorId,
      creatorName
    );

    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
