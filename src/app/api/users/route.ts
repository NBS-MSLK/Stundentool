import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function handleGET() {
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

async function handlePOST(req: Request) {
  try {
    const { name, password, role } = await req.json();
    if (typeof name !== 'string' || !name.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    
    if (role !== undefined && !['USER', 'ADMIN'].includes(role)) return NextResponse.json({ error: 'Ungültige Rolle' }, { status: 400 });
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
    console.error('Create user failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = secureRoute("/api/users", handleGET);
export const POST = secureRoute("/api/users", handlePOST);
