import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, context: unknown) {
  const { id, proposalId } = await (context as any).params;
  
  try {
    const body = await request.json();
    const { userId, userName, vote } = body;

    if (!userId || !userName || !vote) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert vote
    const upsertedVote = await prisma.taskDateVote.upsert({
      where: {
        proposalId_userId: { proposalId, userId }
      },
      update: { vote },
      create: { proposalId, userId, userName, vote }
    });

    // Check if there are now 2 YES votes for this proposal, if so, schedule the task
    const yesVotes = await prisma.taskDateVote.count({
      where: { proposalId, vote: 'YES' }
    });

    if (yesVotes >= 2) {
      const proposal = await prisma.taskDateProposal.findUnique({ where: { id: proposalId } });
      if (proposal) {
        await prisma.task.update({
          where: { id },
          data: { 
            dueDate: proposal.date,
            status: 'SCHEDULED'
          }
        });
      }
    }

    return NextResponse.json({ vote: upsertedVote, yesVotes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
