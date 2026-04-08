import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { name, password } = await req.json();
    if (!name || name.trim() === '' || !password || password.trim() === '') {
      return NextResponse.json({ error: 'Name und Passwort erforderlich' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Determine strict admin rule
    const adminName = 'Nils Beinke-Schulte';
    const targetRole = trimmedName === adminName ? 'ADMIN' : 'USER';

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { name: trimmedName },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { name: trimmedName, password, role: targetRole },
      });
    } else {
      if (user.password === "") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { password, role: targetRole }
        });
      } else if (user.password !== password) {
        return NextResponse.json({ error: 'Falsches Passwort.' }, { status: 401 });
      } else if (trimmedName === adminName && user.role !== 'ADMIN') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' }
        });
      }
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
