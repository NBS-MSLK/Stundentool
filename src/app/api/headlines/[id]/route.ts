import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    
    await prisma.headline.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete headline error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
