import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';


export const dynamic = 'force-dynamic';

async function handleGET() {
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

async function handlePOST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, imageUrl, authorId } = body;
    
    if (!title || !content || !authorId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const news = await prisma.newsPost.create({
      data: { title, content, imageUrl, authorId }
    });
    

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

export const GET = secureRoute("/api/news", handleGET);
export const POST = secureRoute("/api/news", handlePOST);
