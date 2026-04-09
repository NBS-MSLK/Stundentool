import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const { password } = await req.json();

    if (password === undefined) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { password },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
