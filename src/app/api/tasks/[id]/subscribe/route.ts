import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const { userId, subscribe } = await req.json();

    if (subscribe) {
      await prisma.task.update({
        where: { id },
        data: { subscribers: { connect: { id: userId } } }
      });
    } else {
      await prisma.task.update({
        where: { id },
        data: { subscribers: { disconnect: { id: userId } } }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscribe task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
