import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, context: unknown) {
  const { id } = await (context as any).params;
  try {
    const body = await request.json();
    const { materialId, isAcquired } = body;

    if (!materialId || isAcquired === undefined) {
      return NextResponse.json({ error: 'Missing materialId or isAcquired' }, { status: 400 });
    }

    const material = await prisma.taskMaterial.update({
      where: { id: materialId },
      data: { isAcquired }
    });

    return NextResponse.json({ material });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
