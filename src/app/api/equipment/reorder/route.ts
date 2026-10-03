import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function handlePOST(request: Request) {
  try {
    const body = await request.json();
    const { updates } = body; // Array of { id, order }

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid updates payload' }, { status: 400 });
    }

    // Use a transaction to perform bulk updates
    await prisma.$transaction(
      updates.map((update: { id: string; order: number }) =>
        prisma.equipmentCategory.update({
          where: { id: update.id },
          data: { order: update.order }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering categories:', error);
    return NextResponse.json({ error: 'Error reordering categories' }, { status: 500 });
  }
}

export const POST = secureRoute("/api/equipment/reorder", handlePOST);
