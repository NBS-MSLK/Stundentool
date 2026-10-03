import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Bitte anmelden.' }, { status: 401 });
  const { id } = await params;
  const { optionId } = await request.json();
  if (typeof optionId !== 'string' || !optionId) return NextResponse.json({ error: 'Antwort fehlt.' }, { status: 400 });
  try {
    return await prisma.$transaction(async tx => {
      const poll = await tx.poll.findUnique({ where: { id } });
      if (!poll) return NextResponse.json({ error: 'Umfrage nicht gefunden.' }, { status: 404 });
      if (!poll.isActive || poll.isArchived) return NextResponse.json({ error: 'Diese Umfrage ist geschlossen.' }, { status: 409 });
      const option = await tx.pollOption.findFirst({ where: { id: optionId, pollId: id }, select: { id: true } });
      if (!option) return NextResponse.json({ error: 'Antwort gehört nicht zu dieser Umfrage.' }, { status: 400 });
      await tx.pollVote.upsert({
        where: { pollId_userId: { pollId: id, userId: session.user.id } },
        update: { optionId, userName: session.user.name },
        create: { pollId: id, optionId, userId: session.user.id, userName: session.user.name },
      });
      // Return only the caller's selection, never a voter record or identity.
      return NextResponse.json({ myOptionId: optionId });
    });
  } catch {
    return NextResponse.json({ error: 'Abstimmung konnte nicht gespeichert werden.' }, { status: 500 });
  }
}

export const POST = secureRoute("/api/polls/[id]/vote", handlePOST);
