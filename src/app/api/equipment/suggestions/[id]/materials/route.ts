import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const material = await prisma.equipmentMaterial.create({
      data: {
        suggestionId: id,
        name: body.name,
        buyLink: body.buyLink || '',
        quantity: parseInt(body.quantity) || 1,
        pricePerUnit: parseFloat(body.pricePerUnit) || 0
      }
    });
    return NextResponse.json({ material });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating material' }, { status: 500 });
  }
}

export const POST = secureRoute("/api/equipment/suggestions/[id]/materials", handlePOST);
