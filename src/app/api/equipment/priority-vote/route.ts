import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { suggestionId, userId } = body;
    
    // Find the category of the suggestion the user wants to vote for
    const targetSuggestion = await prisma.equipmentSuggestion.findUnique({
      where: { id: suggestionId },
      select: { categoryId: true }
    });
    
    if (!targetSuggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }
    
    const { categoryId } = targetSuggestion;

    // Check if the user already voted for a priority suggestion IN THIS CATEGORY
    const existingVotes = await prisma.equipmentPriorityVote.findMany({
      where: {
        userId,
        suggestion: {
          categoryId
        }
      }
    });
    
    if (existingVotes.length > 0) {
      const existing = existingVotes[0];
      if (existing.suggestionId === suggestionId) {
        // Toggle off
        await prisma.equipmentPriorityVote.delete({ where: { id: existing.id } });
        return NextResponse.json({ status: 'removed' });
      } else {
        // Change vote to the new suggestion in the same category
        const vote = await prisma.equipmentPriorityVote.update({
          where: { id: existing.id },
          data: { suggestionId }
        });
        return NextResponse.json({ status: 'changed', vote });
      }
    } else {
      // Create new vote for this category
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
