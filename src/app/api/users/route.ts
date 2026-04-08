import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Users API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
