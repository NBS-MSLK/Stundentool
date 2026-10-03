// Accept explicit ISO timestamps only; reject JavaScript's coercion and date rollover.
export function parseEntryTime(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const date = new Date(value);
  const calendarDate = new Date(value.slice(0, 10) + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(calendarDate.getTime())) return null;
  if (calendarDate.toISOString().slice(0, 10) !== value.slice(0, 10) || Number(value.slice(11, 13)) > 23) return null;
  return date;
}

export function entryDurationError(start: Date, end: Date): string | null {
  const duration = end.getTime() - start.getTime();
  if (!Number.isFinite(duration)) return 'Bitte gültige Zeitangaben eingeben.';
  if (duration <= 0) return 'Die Endzeit muss nach der Startzeit liegen.';
  if (duration > 10 * 60 * 60 * 1000) return 'Maximal 10 Stunden pro Eintrag erlaubt.';
  return null;
}
