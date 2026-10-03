import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

export const POST = secureRoute("/api/polls/[id]/vote", handlePOST);
