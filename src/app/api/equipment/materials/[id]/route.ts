import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function handlePUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const material = await prisma.equipmentMaterial.update({
      where: { id },
      data: {
        name: body.name,
        buyLink: body.buyLink,
        quantity: parseInt(body.quantity) || 1,
        pricePerUnit: parseFloat(body.pricePerUnit) || 0
      }
    });
    return NextResponse.json({ material });
  } catch (error) {
    return NextResponse.json({ error: 'Error updating material' }, { status: 500 });
  }
}

async function handleDELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.equipmentMaterial.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting material' }, { status: 500 });
  }
}

export const PUT = secureRoute("/api/equipment/materials/[id]", handlePUT);
export const DELETE = secureRoute("/api/equipment/materials/[id]", handleDELETE);
