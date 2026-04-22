import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, context: unknown) {
  const { id } = await (context as any).params;
  
  try {
    const body = await request.json();
    const { date, startTime, endTime } = body;

    const proposedDateTime = new Date(`${date}T${startTime || '08:00'}`);
    const now = new Date();
    const diffMs = proposedDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return NextResponse.json({ error: 'Terminvorschläge sollten 24h Vorlaufzeit haben' }, { status: 400 });
    }

    const proposal = await prisma.taskDateProposal.create({
      data: {
        taskId: id,
        date: new Date(date),
        startTime: startTime || '08:00',
        endTime: endTime || '09:00'
      },
      include: { 
        votes: true,
        task: true // Include task to get the title
      }
    });

    const { sendTaskNotification } = await import('@/lib/mailer');
    sendTaskNotification(
      id,
      `Neuer Terminvorschlag: ${proposal.task.title}`,
      `Hallo,\n\nes wurde ein neuer Terminvorschlag für die Aufgabe "${proposal.task.title}" eingereicht:\n\nDatum: ${new Date(date).toLocaleDateString('de-DE')}\nZeit: ${startTime || '08:00'} - ${endTime || '09:00'} Uhr\n\nBitte stimme im Dashboard ab!`
    );

    return NextResponse.json({ proposal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
