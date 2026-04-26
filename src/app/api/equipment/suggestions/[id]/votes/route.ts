import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const userId = body.userId;
    
    // Toggle logic: if vote exists, delete it. If not, create it.
    const existing = await prisma.equipmentVote.findUnique({
      where: { suggestionId_userId: { suggestionId: id, userId } }
    });
    
    if (existing) {
      await prisma.equipmentVote.delete({ where: { id: existing.id } });
      return NextResponse.json({ status: 'removed' });
    } else {
      const vote = await prisma.equipmentVote.create({
        data: { suggestionId: id, userId }
      });
      return NextResponse.json({ status: 'added', vote });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error toggling vote' }, { status: 500 });
  }
}
