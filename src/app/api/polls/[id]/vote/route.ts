import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { optionId, userId, userName } = body;
    
    if (!optionId || !userId || !userName) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Upsert vote
    const vote = await prisma.pollVote.upsert({
      where: {
        pollId_userId: {
          pollId: id,
          userId: userId
        }
      },
      update: { optionId, userName },
      create: { pollId: id, optionId, userId, userName }
    });
    
    return NextResponse.json({ vote });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
