import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendGeneralNotification } from '@/lib/mailer';
import { logActivity } from '@/lib/activityLogger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const headlines = await prisma.headline.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: true }
    });
    return NextResponse.json({ headlines });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);
    const { content, authorId } = body;
    if (!content || !authorId) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const newHeadline = await prisma.headline.create({
      data: { content, authorId }
    });
    
    // We can also trigger notifications here if needed
    // Send notification in background to not block UI
    sendGeneralNotification(
      'HEADLINE',
      'Neue Kurzmeldung im MakerSpace',
      `Es gibt eine neue Kurzmeldung:\n\n"${content}"`,
      'https://stundentool-production.up.railway.app/dashboard'
    ).catch(console.error);

    const user = await prisma.user.findUnique({ where: { id: authorId }});
    await logActivity(
      'HEADLINE_CREATE',
      `${user?.name || 'Jemand'} hat eine Kurzmeldung verfasst: "${content}"`,
      authorId,
      user?.name
    );

    return NextResponse.json({ headline: newHeadline });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
