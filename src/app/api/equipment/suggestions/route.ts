import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await prisma.user.findUnique({ where: { id: body.creatorId } });
    const suggestion = await prisma.equipmentSuggestion.create({
      data: {
        categoryId: body.categoryId,
        title: body.title,
        description: body.description || '',
        creatorId: body.creatorId,
        creatorName: user?.name || 'Unknown',
        imageUrl: body.imageUrl || '',
        buyLink: body.buyLink || '',
        price: parseFloat(body.price) || 0
      }
    });

    if (user) {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'Gerät vorgeschlagen',
          details: `Das Gerät "${body.title}" wurde vorgeschlagen.`
        }
      });
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating suggestion' }, { status: 500 });
  }
}
