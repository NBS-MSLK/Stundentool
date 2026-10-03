import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


async function handlePUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['isActive', 'isArchived'].includes(key)) || Object.values(body).some(value => typeof value !== 'boolean')) {
      return NextResponse.json({ error: 'Nur Aktiv- und Archivstatus können geändert werden.' }, { status: 400 });
    }
    const poll = await prisma.poll.update({
      where: { id },
      data: body
    });
    return NextResponse.json({ poll });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleDELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.poll.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const PUT = secureRoute("/api/polls/[id]", handlePUT);
export const DELETE = secureRoute("/api/polls/[id]", handleDELETE);
