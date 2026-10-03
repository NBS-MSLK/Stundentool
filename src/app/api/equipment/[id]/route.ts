import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function handlePUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const category = await prisma.equipmentCategory.update({
      where: { id },
      data: { title: body.title, description: body.description }
    });
    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json({ error: 'Error updating category' }, { status: 500 });
  }
}

async function handleDELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.equipmentCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting category' }, { status: 500 });
  }
}

export const PUT = secureRoute("/api/equipment/[id]", handlePUT);
export const DELETE = secureRoute("/api/equipment/[id]", handleDELETE);
