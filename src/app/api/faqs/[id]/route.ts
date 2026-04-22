import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { question, answer, order } = body;
    
    const dataToUpdate: any = {};
    if (question !== undefined) dataToUpdate.question = question;
    if (answer !== undefined) dataToUpdate.answer = answer;
    if (order !== undefined) dataToUpdate.order = order;

    const faq = await prisma.fAQ.update({
      where: { id },
      data: dataToUpdate
    });
    return NextResponse.json({ faq });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.fAQ.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
