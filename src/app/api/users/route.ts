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

export async function POST(req: Request) {
  try {
    const { name, password, role } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    
    const existing = await prisma.user.findUnique({ where: { name } });
    if (existing) return NextResponse.json({ error: 'Nutzername existiert bereits' }, { status: 400 });

    const user = await prisma.user.create({
      data: {
        name,
        password: password || '',
        role: role || 'USER',
      },
    });
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
