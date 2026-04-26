import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendGeneralNotification } from '@/lib/mailer';
import { logActivity } from '@/lib/activityLogger';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const news = await prisma.newsPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } } }
    });
    return NextResponse.json({ news });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, imageUrl, authorId } = body;
    
    if (!title || !content || !authorId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const news = await prisma.newsPost.create({
      data: { title, content, imageUrl, authorId }
    });
    
    await sendGeneralNotification(
      'NEWS',
      `Neue Nachricht: ${title}`,
      `Es gibt eine neue Nachricht im MakerSpace:\n\n${title}\n\n${content}`,
      'https://stundentool-production.up.railway.app/dashboard'
    );

    const user = await prisma.user.findUnique({ where: { id: authorId }});
    await logActivity(
      'NEWS_POST',
      `${user?.name || 'Jemand'} hat eine neue Nachricht gepostet: "${title}"`,
      authorId,
      user?.name
    );

    return NextResponse.json({ news });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
