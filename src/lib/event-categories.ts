export const EVENT_CATEGORIES = {
  GENERAL: 'Treffen & Sonstiges',
  WORK: 'Arbeitseinsatz',
  MEETING: 'Versammlung',
} as const;
export type EventCategory = keyof typeof EVENT_CATEGORIES;
export function isEventCategory(value: unknown): value is EventCategory {
  return typeof value === 'string' && Object.hasOwn(EVENT_CATEGORIES, value);
}
