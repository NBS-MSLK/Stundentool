import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function handleGET() {
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
      orderBy: { order: 'asc' }
    });

    const numbers = await prisma.$queryRaw<{ suggestionId: string; number: number }[]>`SELECT "suggestionId", "number" FROM "InventoryNumber"`;
    const byId = new Map(numbers.map(entry => [entry.suggestionId, entry.number]));
    const withInventory = categories.map(category => ({ ...category, suggestions: category.suggestions.map(item => ({ ...item, inventoryNumber: byId.get(item.id) ?? null })) }));
    return NextResponse.json({ budget: budget || { totalAmount: 0 }, categories: withInventory });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching equipment data' }, { status: 500 });
  }
}

async function handlePOST(request: Request) {
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

export const GET = secureRoute("/api/equipment", handleGET);
export const POST = secureRoute("/api/equipment", handlePOST);
