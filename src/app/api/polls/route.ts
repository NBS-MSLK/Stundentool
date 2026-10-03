import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendGeneralNotification } from '@/lib/mailer';
import { logActivity } from '@/lib/activityLogger';


export const dynamic = 'force-dynamic';

async function handleGET() {
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
