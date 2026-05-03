import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, creatorId } = body;
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const category = await prisma.equipmentCategory.create({
      data: {
        title,
        creatorId: creatorId || null
      }
    });

    if (creatorId) {
      const user = await prisma.user.findUnique({ where: { id: creatorId } });
      if (user) {
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            userName: user.name,
            action: 'Kategorie erstellt',
            details: `Kategorie "${title}" wurde vorgeschlagen.`
          }
        });
      }
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Error creating category' }, { status: 500 });
  }
}
