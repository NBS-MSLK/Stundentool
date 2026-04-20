import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, context: unknown) {
  const { id } = await (context as any).params;
  
  try {
    const body = await request.json();
    const { date, timeOfDay } = body;

    if (!date) {
      return NextResponse.json({ error: 'Missing date' }, { status: 400 });
    }

    const proposal = await prisma.taskDateProposal.create({
      data: {
        taskId: id,
        date: new Date(date),
        timeOfDay: timeOfDay || 'ALL_DAY'
      },
      include: { votes: true }
    });

    return NextResponse.json({ proposal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
