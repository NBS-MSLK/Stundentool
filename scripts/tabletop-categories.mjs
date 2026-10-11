// One-time correction of the existing live Tabletop category, requested by its owner.
// IDs identify the reviewed entries; no names, prices, quantities or statuses are rewritten.
export const tabletopGroups = [
  ['Grundierung', ['dd332acd-d8cf-40a9-9fd9-90d4a045cf61']],
  ['Geländebau-Sets', ['924a0314-131f-4fa6-91f4-5a25f13e5d6a']],
  ['Farben', ['dbbc0a3e-def4-4d21-bc1b-33694883c2ef']],
  ['Miniatur-Malset', ['a7c7a0b2-5bb6-4cd4-af1e-5aef3b3ed057']],
  ['Heißdrahtschneider', ['5878d4b0-a497-4a74-83c3-b5a7cc2b9d07', 'f2ec6696-cf5e-420a-98f6-b0b9c0044561', '6b46c9cb-f43f-4172-aeca-f5dfe87b26ad']],
  ['Werkzeugsets', ['1976312b-d878-4696-bbd6-7db858d39c91']],
  ['Schneidematten', ['600d7349-e930-4f54-8f16-8127be034375']],
  ['Malgriffe XL', ['d64b8466-fcd0-4e6d-839f-f980800d7106']],
  ['Malgriffe Standard', ['dd62291f-4c93-4bb8-8da2-c78da18321be']],
  ['Pinselsets', ['89fd28b5-4050-4345-8c8f-8500c49eba14']],
  ['Trockenpinsel', ['805e6e0f-ac1c-49e3-b084-20cb401d258c']],
];

export async function splitTabletop(prisma) {
  return prisma.$transaction(async tx => {
    const categories = await tx.equipmentCategory.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }], include: { suggestions: { select: { id: true } } } });
    const source = categories.find(category => /^\d+\. Geländebau Tabletop$/.test(category.title) && category.suggestions.some(item => tabletopGroups.some(([, ids]) => ids.includes(item.id))));
    if (!source) return 0; // Already split, or this database does not contain the reviewed category.
    const prefix = source.title.match(/^\d+/)[0];
    if (categories.some(category => category.id !== source.id && category.title.startsWith(`${prefix}.`) && /^\d+\.\d+\s/.test(category.title))) throw new Error('Tabletop: category number already used by another group; refusing to merge.');
    const existingIds = new Set(source.suggestions.map(item => item.id));
    const groups = tabletopGroups.map(([name, ids]) => [name, ids.filter(id => existingIds.has(id))]).filter(([, ids]) => ids.length);
    const known = new Set(groups.flatMap(([, ids]) => ids));
    const remaining = [...existingIds].filter(id => !known.has(id));
    if (remaining.length) groups.push(['Weitere Vorschläge', remaining]);
    const expanded = [];
    for (let index = 0; index < groups.length; index++) {
      const [name, ids] = groups[index];
      const title = `${prefix}.${index + 1} Geländebau Tabletop: ${name}`;
      const category = index === 0
        ? await tx.equipmentCategory.update({ where: { id: source.id }, data: { title } })
        : await tx.equipmentCategory.create({ data: { title, creatorId: source.creatorId, description: source.description } });
      await tx.equipmentSuggestion.updateMany({ where: { id: { in: ids }, categoryId: source.id }, data: { categoryId: category.id } });
      expanded.push(category);
    }
    const ordered = categories.flatMap(category => category.id === source.id ? expanded : [category]);
    for (let index = 0; index < ordered.length; index++) await tx.equipmentCategory.update({ where: { id: ordered[index].id }, data: { order: index } });
    return groups.length;
  }, { timeout: 30000 });
}
