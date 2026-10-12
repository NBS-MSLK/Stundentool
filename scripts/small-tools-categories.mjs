import { splitReviewedCategory } from './tabletop-categories.mjs';

export const smallToolsGroups = [
  ['Schraubendreher', ['b7f77384-6d6c-4556-b491-a7d6b498ae3d']],
  ['Zangen', ['4180ef26-7b20-43a6-85a1-abcd15375243']],
  ['Seitenschneider', ['a05c549f-2e5c-49dd-961c-82e146cd8107']],
  ['Pinzetten', ['b9f0ef59-fd8f-40ad-b30f-86796510a931']],
];

export function splitSmallTools(prisma) {
  return splitReviewedCategory(prisma, 'Feinwerkzeug', smallToolsGroups);
}
