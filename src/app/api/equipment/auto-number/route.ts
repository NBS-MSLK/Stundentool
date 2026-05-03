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

    let currentTopNumber = 0;
    let currentGroupSubNumber = 0;
    let lastGroupName = '';

    const updates = [];

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const parsed = parseCategoryTitle(cat.title);
      let newTitle = '';

      if (parsed.isGrouped) {
        if (parsed.groupName !== lastGroupName) {
          currentTopNumber++;
          currentGroupSubNumber = 1;
          lastGroupName = parsed.groupName;
        } else {
          currentGroupSubNumber++;
        }
        newTitle = `${currentTopNumber}.${currentGroupSubNumber} ${parsed.groupName}: ${parsed.subName}`;
      } else {
        currentTopNumber++;
        lastGroupName = ''; // Reset
        newTitle = `${currentTopNumber}. ${parsed.groupName}`;
      }

      updates.push(
        prisma.equipmentCategory.update({
          where: { id: cat.id },
          data: { 
            title: newTitle,
            order: i // Also normalize the order to be strictly sequential (0, 1, 2...)
          }
        })
      );
    }

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true, updatedCount: updates.length });
  } catch (error) {
    console.error('Error auto-numbering categories:', error);
    return NextResponse.json({ error: 'Error auto-numbering categories' }, { status: 500 });
  }
}
