import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function handlePOST(request: Request, context: unknown) {
  const { id } = await (context as any).params;
  
  try {
    const body = await request.json();
    const { date, startTime, endTime } = body;

    const proposedDateTime = new Date(`${date}T${startTime || '08:00'}`);
    const now = new Date();

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

    return NextResponse.json({ proposal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = secureRoute("/api/tasks/[id]/proposals", handlePOST);
