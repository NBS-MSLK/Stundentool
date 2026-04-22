import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    let funding = await prisma.fundingStatus.findUnique({
      where: { id: 'singleton' }
    });
    
    if (!funding) {
      funding = await prisma.fundingStatus.create({
        data: { id: 'singleton' }
      });
    }
    
    return NextResponse.json({ funding });
  } catch (error: any) {
    console.error('Error fetching funding:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { totalAmount, disbursedAmount, submittedAmount, lastSubmittedDate } = body;
    
    const dataToUpdate: any = {};
    if (totalAmount !== undefined) dataToUpdate.totalAmount = parseFloat(totalAmount);
    if (disbursedAmount !== undefined) dataToUpdate.disbursedAmount = parseFloat(disbursedAmount);
    if (submittedAmount !== undefined) dataToUpdate.submittedAmount = parseFloat(submittedAmount);
    if (lastSubmittedDate !== undefined) {
      dataToUpdate.lastSubmittedDate = lastSubmittedDate ? new Date(lastSubmittedDate) : null;
    }

    const funding = await prisma.fundingStatus.upsert({
      where: { id: 'singleton' },
      update: dataToUpdate,
      create: {
        id: 'singleton',
        ...dataToUpdate
      }
    });

    return NextResponse.json({ funding });
  } catch (error: any) {
    console.error('Error updating funding:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
