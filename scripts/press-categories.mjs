import { splitReviewedCategory } from './tabletop-categories.mjs';

export const pressGroups = [
  ['Mugpress für Tassen', ['f3d38d2a-ce22-4709-8191-152085c85b5c']],
  ['Wonderpress für Stoffe', ['f0d2ed1a-2811-48dc-8985-ca371e56aa54']],
];

export function splitPresses(prisma) {
  return splitReviewedCategory(prisma, 'EasyPress', pressGroups);
}
