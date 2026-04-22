import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const faqs = await prisma.fAQ.findMany({
      orderBy: { order: 'asc' }
    });
    return NextResponse.json({ faqs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, answer, order } = body;
    
    if (!question || !answer) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const faq = await prisma.fAQ.create({
      data: { question, answer, order: order || 0 }
    });
    return NextResponse.json({ faq });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
