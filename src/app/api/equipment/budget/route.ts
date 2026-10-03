import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function handlePUT(request: Request) {
  try {
    const body = await request.json();
    const budget = await prisma.equipmentBudget.upsert({
      where: { id: 'singleton' },
      update: { totalAmount: parseFloat(body.totalAmount) },
      create: { id: 'singleton', totalAmount: parseFloat(body.totalAmount) }
    });
    return NextResponse.json({ budget });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error updating budget' }, { status: 500 });
  }
}

export const PUT = secureRoute("/api/equipment/budget", handlePUT);
