import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all'; // 'all' or 'month'

    let startDate: Date | undefined;
    if (filter === 'month') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const whereClause: any = {
      endTime: { not: null },
      user: { showInHighscore: true }
    };
    if (startDate) {
      whereClause.startTime = { gte: startDate };
    }

    const entries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    const userHours: Record<string, { id: string; name: string; hours: number }> = {};

    entries.forEach(e => {
      if (!e.user) return;
      const start = new Date(e.startTime).getTime();
      const end = new Date(e.endTime!).getTime();
      const diffMs = end - start;
      let hours = Math.ceil(diffMs / (1000 * 60 * 60));
      if (hours < 1) hours = 1;

      if (!userHours[e.user.id]) {
        userHours[e.user.id] = { id: e.user.id, name: e.user.name, hours: 0 };
      }
      userHours[e.user.id].hours += hours;
    });

    const highscore = Object.values(userHours).sort((a, b) => b.hours - a.hours);

    return NextResponse.json({ highscore });
  } catch (error) {
    console.error('Highscore API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
