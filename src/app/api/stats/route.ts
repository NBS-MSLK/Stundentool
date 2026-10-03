import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function handleGET() {
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

    const funding = await prisma.fundingStatus.findUnique({
      where: { id: 'singleton' }
    });

    return NextResponse.json({ 
      systemActiveHours, 
      systemArchivedHours,
      hardcodedBaseHours: funding?.baseHours || 619,
      totalGoalHours: funding?.goalHours || 2700
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = secureRoute("/api/stats", handleGET);
