import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const polls = await prisma.poll.findMany({
      orderBy: { createdAt: 'desc' },
      include: { 
        options: { include: { votes: true } },
        votes: true 
      }
    });
    return NextResponse.json({ polls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, isAnonymous, options } = body;
    
    if (!question || !options || options.length < 2) {
      return NextResponse.json({ error: 'Missing question or options' }, { status: 400 });
    }

    const poll = await prisma.poll.create({
      data: { 
        question, 
        isAnonymous,
        options: {
          create: options.map((opt: string) => ({ text: opt }))
        }
      },
      include: { options: true }
    });
    return NextResponse.json({ poll });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
