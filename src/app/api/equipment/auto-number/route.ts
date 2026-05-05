import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function parseCategoryTitle(title: string) {
  // Remove leading numbers like "9.1 ", "10. "
  const cleanedTitle = title.replace(/^(\d+\.\d+|\d+\.)\s*/, '').trim();
  const colonIndex = cleanedTitle.indexOf(':');
  
  if (colonIndex !== -1) {
    return {
      isGrouped: true,
      groupName: cleanedTitle.substring(0, colonIndex).trim(),
      subName: cleanedTitle.substring(colonIndex + 1).trim()
    };
  } else {
    return {
      isGrouped: false,
      groupName: cleanedTitle,
      subName: ''
    };
  }
}

export async function POST() {
  try {
    // Fetch all categories sorted by current order, then by creation date as fallback
    const categories = await prisma.equipmentCategory.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Group categories by groupName to prevent splitting groups
    const grouped = new Map<string, { cat: any, parsed: any }[]>();
    const groupOrder: string[] = [];

    for (const cat of categories) {
      const parsed = parseCategoryTitle(cat.title);
      // Non-grouped categories use their own ID as a unique group key
      const key = parsed.isGrouped ? parsed.groupName : cat.id;

      if (!grouped.has(key)) {
        grouped.set(key, []);
        groupOrder.push(key);
      }
      grouped.get(key)!.push({ cat, parsed });
    }

    let currentTopNumber = 0;
    const updates = [];
    let globalIndex = 0;

    for (const key of groupOrder) {
      currentTopNumber++;
      const items = grouped.get(key)!;
      
      let currentGroupSubNumber = 0;
      for (const item of items) {
        const { cat, parsed } = item;
        let newTitle = '';

        if (parsed.isGrouped) {
          currentGroupSubNumber++;
          newTitle = `${currentTopNumber}.${currentGroupSubNumber} ${parsed.groupName}: ${parsed.subName}`;
        } else {
          newTitle = `${currentTopNumber}. ${parsed.groupName}`;
        }

        updates.push(
          prisma.equipmentCategory.update({
            where: { id: cat.id },
            data: { 
              title: newTitle,
              order: globalIndex
            }
          })
        );
        globalIndex++;
      }
    }

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true, updatedCount: updates.length });
  } catch (error) {
    console.error('Error auto-numbering categories:', error);
    return NextResponse.json({ error: 'Error auto-numbering categories' }, { status: 500 });
  }
}
