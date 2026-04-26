import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const user = await prisma.user.findUnique({ where: { id: body.userId } });
    const note = await prisma.equipmentNote.create({
      data: {
        suggestionId: id,
        userId: body.userId,
        userName: user?.name || 'Unknown',
        content: body.content
      },
      include: { user: { select: { id: true, name: true } } }
    });
    return NextResponse.json({ note });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating note' }, { status: 500 });
  }
}
