import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export async function POST(request: Request) {
  try {
    const { oldGroupName, newGroupName } = await request.json();
    
    if (!oldGroupName || !newGroupName) {
      return NextResponse.json({ error: 'Missing names' }, { status: 400 });
    }

    const categories = await prisma.equipmentCategory.findMany();
    
    const updates = [];
    
    for (const cat of categories) {
      const match = cat.title.match(/^(\d+)\.\d+\s(.*?):\s?(.*)/);
      if (match && match[2] === oldGroupName) {
        const newTitle = cat.title.replace(
          new RegExp(`^(\\d+\\.\\d+\\s)${escapeRegExp(oldGroupName)}(:\\s?.*)`), 
          `$1${newGroupName}$2`
        );
        updates.push(
          prisma.equipmentCategory.update({
            where: { id: cat.id },
            data: { title: newTitle }
          })
        );
      }
    }
    
    await prisma.$transaction(updates);
    
    return NextResponse.json({ success: true, updatedCount: updates.length });
  } catch (error) {
    console.error('Error renaming group:', error);
    return NextResponse.json({ error: 'Error renaming group' }, { status: 500 });
  }
}
