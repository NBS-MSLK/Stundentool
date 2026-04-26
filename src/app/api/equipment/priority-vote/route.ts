import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { suggestionId, userId } = body;
    
    // A user can only have one priority vote. If they click the same suggestion, maybe toggle it off?
    // If they click a different one, update their vote.
    const existing = await prisma.equipmentPriorityVote.findUnique({
      where: { userId }
    });
    
    if (existing) {
      if (existing.suggestionId === suggestionId) {
        // Toggle off
        await prisma.equipmentPriorityVote.delete({ where: { id: existing.id } });
        return NextResponse.json({ status: 'removed' });
      } else {
        // Change vote
        const vote = await prisma.equipmentPriorityVote.update({
          where: { id: existing.id },
          data: { suggestionId }
        });
        return NextResponse.json({ status: 'changed', vote });
      }
    } else {
      // Create new vote
      const vote = await prisma.equipmentPriorityVote.create({
        data: { suggestionId, userId }
      });
      return NextResponse.json({ status: 'added', vote });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error processing priority vote' }, { status: 500 });
  }
}
