import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    return NextResponse.json({ news });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
