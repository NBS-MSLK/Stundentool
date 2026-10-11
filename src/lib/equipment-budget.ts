type Suggestion = {
  status: string;
  price: number;
  quantity: number;
  materials?: { quantity: number; pricePerUnit: number }[];
  priorityVotes?: unknown[];
};

export function equipmentCost(item: Suggestion) {
  return item.price * (item.quantity || 1) + (item.materials || []).reduce((sum, material) => sum + material.quantity * material.pricePerUnit, 0);
}

type PurchasedItem = Suggestion & { id: string; title: string };

export function purchasedGroups(categories: { title: string; suggestions: PurchasedItem[] }[]) {
  const groups = new Map<string, { title: string; total: number; items: (PurchasedItem & { cost: number; category: string })[] }>();
  for (const category of categories) {
    const title = category.title.replace(/^\s*\d+(?:\.\d+)*\.?\s*/, '').split(':')[0].trim() || category.title;
    for (const item of category.suggestions) {
      if (item.status !== 'PURCHASED') continue;
      const key = title.toLocaleLowerCase('de-DE');
      const group = groups.get(key) || { title, total: 0, items: [] };
      const cost = equipmentCost(item);
      group.total += cost;
      group.items.push({ ...item, cost, category: category.title });
      groups.set(key, group);
    }
  }
  return [...groups.values()].sort((a, b) => a.title.localeCompare(b.title, 'de', { numeric: true }));
}

export function equipmentBudgetTotals(categories: { suggestions: Suggestion[] }[]) {
  let spentAmount = 0;
  let plannedAmount = 0;
  for (const category of categories) {
    const purchased = category.suggestions.filter(item => item.status === 'PURCHASED');
    const spent = purchased.reduce((sum, item) => sum + equipmentCost(item), 0);
    spentAmount += spent;
    if (purchased.length) {
      plannedAmount += spent;
    } else {
      const candidates = category.suggestions.filter(item => item.status !== 'REJECTED');
      const top = candidates.reduce<Suggestion | undefined>((best, item) => !best || (item.priorityVotes?.length || 0) > (best.priorityVotes?.length || 0) ? item : best, undefined);
      if (top) plannedAmount += equipmentCost(top);
    }
  }
  return { spentAmount, plannedAmount };
}
