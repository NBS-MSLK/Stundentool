import { getSession } from '@/lib/session';
import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendGeneralNotification } from '@/lib/mailer';
import { logActivity } from '@/lib/activityLogger';


export const dynamic = 'force-dynamic';

async function handleGET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Bitte anmelden.' }, { status: 401 });
    const records = await prisma.poll.findMany({
      orderBy: { createdAt: 'desc' },
      include: { 
        options: { include: {
          _count: { select: { votes: true } },
          votes: { where: { poll: { isAnonymous: false } }, select: { userName: true } },
        } },
        _count: { select: { votes: true } },
        votes: { where: { userId: session.user.id }, select: { optionId: true } }
      }
    });
    const polls = records.map(({ votes, options, _count, ...poll }) => ({
      ...poll,
      totalVotes: _count.votes,
      myOptionId: votes[0]?.optionId ?? null,
      options: options.map(({ _count, votes: optionVotes, ...option }) => ({
        ...option,
        voteCount: _count.votes,
        ...(!poll.isAnonymous ? { voterNames: optionVotes.map(vote => vote.userName) } : {}),
      })),
    }));
    return NextResponse.json({ polls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handlePOST(request: Request) {
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
    
    sendGeneralNotification(
      'POLL',
      'Neue Umfrage im MakerSpace',
      `Es gibt eine neue Umfrage:\n\n${question}`,
      'https://stundentool-production.up.railway.app/dashboard'
    ).catch(console.error);

    await logActivity(
      'POLL_CREATE',
      `Eine neue Umfrage wurde erstellt: "${question}"`,
      null,
      'Admin'
    );

    return NextResponse.json({ poll });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = secureRoute("/api/polls", handleGET);
export const POST = secureRoute("/api/polls", handlePOST);
