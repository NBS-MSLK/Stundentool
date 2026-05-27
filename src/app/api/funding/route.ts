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

function safeParseFloat(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  
  let str = String(val).trim();
  
  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      str = str.replace(/\./g, '').replace(/,/g, '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(/,/g, '.');
  }
  
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { totalAmount, disbursedAmount, submittedAmount, lastSubmittedDate, baseHours, goalHours } = body;
    
    const dataToUpdate: any = {};
    if (totalAmount !== undefined) dataToUpdate.totalAmount = safeParseFloat(totalAmount);
    if (disbursedAmount !== undefined) dataToUpdate.disbursedAmount = safeParseFloat(disbursedAmount);
    if (submittedAmount !== undefined) dataToUpdate.submittedAmount = safeParseFloat(submittedAmount);
    if (lastSubmittedDate !== undefined) {
      dataToUpdate.lastSubmittedDate = lastSubmittedDate ? new Date(lastSubmittedDate) : null;
    }
    if (baseHours !== undefined) dataToUpdate.baseHours = parseInt(baseHours);
    if (goalHours !== undefined) dataToUpdate.goalHours = parseInt(goalHours);

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
