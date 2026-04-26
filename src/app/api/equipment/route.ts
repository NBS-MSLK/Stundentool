import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const budget = await prisma.equipmentBudget.findUnique({
      where: { id: 'singleton' }
    });

    const categories = await prisma.equipmentCategory.findMany({
      include: {
        suggestions: {
          include: {
            creator: { select: { id: true, name: true } },
            materials: true,
            votes: true,
            notes: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
            priorityVotes: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ budget: budget || { totalAmount: 0 }, categories });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching equipment data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const category = await prisma.equipmentCategory.create({
      data: {
        title: body.title,
        description: body.description || ''
      }
    });
    return NextResponse.json({ category });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating category' }, { status: 500 });
  }
}
