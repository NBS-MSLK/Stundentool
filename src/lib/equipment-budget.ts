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
