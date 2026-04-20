import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    const tasks = await prisma.task.findMany({
      where: status ? { status } : undefined,
      include: {
        steps: true,
        materials: true,
        volunteers: true,
        dateProposals: {
          include: { votes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, creatorId, creatorName, imageUrl, estimatedHours, creatorIsContact, proposedDates, steps, materials } = body;

    if (!title || !creatorId || !creatorName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        creatorId,
        creatorName,
        imageUrl,
        estimatedHours: estimatedHours ? parseInt(estimatedHours) : null,
        creatorIsContact: creatorIsContact !== undefined ? creatorIsContact : true,
        steps: steps && steps.length > 0 ? {
          create: steps.map((s: any) => ({ 
            description: s.description, 
            estimatedHours: s.estimatedHours ? parseInt(s.estimatedHours) : null 
          }))
        } : undefined,
        materials: materials && materials.length > 0 ? {
          create: materials.map((m: any) => ({ name: m.name, buyLink: m.buyLink }))
        } : undefined,
        dateProposals: proposedDates && proposedDates.length > 0 ? {
          create: proposedDates.map((p: any) => ({
            date: new Date(p.date),
            timeOfDay: p.timeOfDay
          }))
        } : undefined,
      },
      include: {
        steps: true,
        materials: true,
        dateProposals: true
      }
    });
    
    // Automatically add the creator as volunteer if creatorIsContact
    if (creatorIsContact) {
      await prisma.taskVolunteer.create({
        data: {
          taskId: task.id,
          userId: creatorId,
          userName: creatorName,
          role: 'CONTACT'
        }
      });
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
