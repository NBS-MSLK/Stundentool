import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const entries = await prisma.timeEntry.findMany({
      where: {
        endTime: { not: null },
      },
      select: {
        startTime: true,
        endTime: true,
        isArchived: true,
        isConfirmed: true,
      }
    });

    let systemActiveHours = 0;
    let systemArchivedHours = 0;

    entries.forEach(e => {
      const start = new Date(e.startTime).getTime();
      const end = new Date(e.endTime!).getTime();
      const diffMs = end - start;
      let hours = Math.ceil(diffMs / (1000 * 60 * 60));
      if (hours < 1) hours = 1;

      if (e.isArchived) {
        systemArchivedHours += hours;
      } else {
        systemActiveHours += hours;
      }
    });

    return NextResponse.json({ 
      systemActiveHours, 
      systemArchivedHours,
      hardcodedBaseHours: 619,
      totalGoalHours: 2700
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
