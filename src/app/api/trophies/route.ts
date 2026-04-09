import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ACTIVITIES } from '@/lib/activities';
import { getActivityCategory } from '@/lib/trophies';

export async function GET() {
  try {
    const entries = await prisma.timeEntry.findMany({
      where: { endTime: { not: null } },
      include: {
        user: { select: { id: true, name: true, showInHighscore: true } }
      }
    });

    const userTrophies: Record<string, string[]> = {};
    const userHours: Record<string, number> = {};
    const userCatHours: Record<string, Record<string, number>> = {};
    const userNameMap: Record<string, string> = {};

    entries.forEach(e => {
      if (!e.user) return;
      const uid = e.user.id;
      userNameMap[uid] = e.user.name;

      if (!userTrophies[uid]) userTrophies[uid] = [];
      if (!userHours[uid]) userHours[uid] = 0;
      if (!userCatHours[uid]) userCatHours[uid] = {};

      const start = new Date(e.startTime);
      const end = new Date(e.endTime!);
      const diffMs = end.getTime() - start.getTime();
      let hoursFloat = diffMs / (1000 * 60 * 60);
      let hours = Math.ceil(hoursFloat);
      if (hours < 1) hours = 1;

      userHours[uid] += hours;

      const cat = getActivityCategory(e.activity, ACTIVITIES);
      if (!userCatHours[uid][cat]) userCatHours[uid][cat] = 0;
      userCatHours[uid][cat] += hours;

      // Ausdauer
      const dur = userTrophies[uid];
      if (hoursFloat >= 2 && !dur.includes('dur_2h')) dur.push('dur_2h');
      if (hoursFloat >= 4 && !dur.includes('dur_4h')) dur.push('dur_4h');
      if (hoursFloat >= 5 && !dur.includes('dur_5h')) dur.push('dur_5h');
      if (hoursFloat >= 6 && !dur.includes('dur_6h')) dur.push('dur_6h');
      if (hoursFloat >= 8 && hoursFloat <= 24 && !dur.includes('dur_8h')) dur.push('dur_8h');

      // Special
      const startHour = start.getHours();
      const endHour = end.getHours();
      if (!e.isManualEntry) {
        if (startHour <= 10 && !dur.includes('spec_early')) dur.push('spec_early');
        if ((startHour >= 20 || endHour >= 20) && !dur.includes('spec_night')) dur.push('spec_night');
      }
      if (hoursFloat > 24 && !dur.includes('spec_time')) dur.push('spec_time');
    });

    // Meilensteine auswerten
    for (const [uid, total] of Object.entries(userHours)) {
      const dur = userTrophies[uid];
      if (total >= 1 && !dur.includes('ms_1h')) dur.push('ms_1h');
      if (total >= 5 && !dur.includes('ms_5h')) dur.push('ms_5h');
      if (total >= 10 && !dur.includes('ms_10h')) dur.push('ms_10h');
      if (total >= 25 && !dur.includes('ms_25h')) dur.push('ms_25h');
      if (total >= 50 && !dur.includes('ms_50h')) dur.push('ms_50h');
      if (total >= 75 && !dur.includes('ms_75h')) dur.push('ms_75h');
      if (total >= 100 && !dur.includes('ms_100h')) dur.push('ms_100h');
    }

    // Kategorie-Könige Berechnen (Fairness-Zuteilung)
    const allCatEntries: { uid: string, cat: string, hours: number }[] = [];
    for (const uid in userCatHours) {
      for (const cat in userCatHours[uid]) {
        allCatEntries.push({ uid, cat, hours: userCatHours[uid][cat] });
      }
    }
    allCatEntries.sort((a, b) => b.hours - a.hours);

    const hasCrown: Record<string, boolean> = {};
    const categoryKings: Record<string, { userId: string, userName: string, hours: number }> = {};

    for (const entry of allCatEntries) {
      if (!categoryKings[entry.cat] && !hasCrown[entry.uid]) {
        // Zuteilen!
        categoryKings[entry.cat] = { userId: entry.uid, userName: userNameMap[entry.uid], hours: entry.hours };
        hasCrown[entry.uid] = true;
      }
    }

    return NextResponse.json({ userTrophies, categoryKings });

  } catch (error) {
    console.error('Trophies API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
