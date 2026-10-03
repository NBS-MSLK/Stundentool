import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function handleGET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const suggestion = await prisma.equipmentSuggestion.findUnique({
      where: { id },
      include: {
        category: true,
        creator: { select: { id: true, name: true } },
        materials: true,
        votes: true,
        notes: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
        priorityVotes: true
      }
    });
    return NextResponse.json({ suggestion });
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching suggestion' }, { status: 500 });
  }
}

async function handlePUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.buyLink !== undefined) updateData.buyLink = body.buyLink;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.quantity !== undefined) updateData.quantity = parseInt(body.quantity) || 1;
    if (body.status !== undefined) updateData.status = body.status;
    
    const suggestion = await prisma.equipmentSuggestion.update({
      where: { id },
      data: updateData
    });
    
    if (body.status === 'PURCHASED') {
      await prisma.equipmentSuggestion.updateMany({
        where: { 
          categoryId: suggestion.categoryId,
          id: { not: id }
        },
        data: { status: 'REJECTED' }
      });
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    return NextResponse.json({ error: 'Error updating suggestion' }, { status: 500 });
  }
}

async function handleDELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.equipmentSuggestion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting suggestion' }, { status: 500 });
  }
}

export const GET = secureRoute("/api/equipment/suggestions/[id]", handleGET);
export const PUT = secureRoute("/api/equipment/suggestions/[id]", handlePUT);
export const DELETE = secureRoute("/api/equipment/suggestions/[id]", handleDELETE);
