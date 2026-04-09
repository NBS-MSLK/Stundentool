export type Trophy = {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'milestone' | 'endurance' | 'special' | 'king';
};

export const TROPHIES: Trophy[] = [
  // Meilensteine
  { id: 'ms_1h', name: 'Der erste Schritt', description: 'Die erste Stunde voller Einsatz!', icon: '🥉', type: 'milestone' },
  { id: 'ms_5h', name: 'Warmlaufen', description: '5 Stunden gemeistert.', icon: '👟', type: 'milestone' },
  { id: 'ms_10h', name: 'Dranbleiber', description: 'Starke 10 Ehrenamts-Stunden erreicht!', icon: '🥈', type: 'milestone' },
  { id: 'ms_25h', name: 'Fels in der Brandung', description: '25 Stunden Projektarbeit!', icon: '🪨', type: 'milestone' },
  { id: 'ms_50h', name: 'MakerSpace Legende', description: '50 Stunden – absolut legendär!', icon: '🥇', type: 'milestone' },
  { id: 'ms_75h', name: 'Inventar', description: '75 Stunden! Du gehörst fast schon zum Inventar.', icon: '🛋️', type: 'milestone' },
  { id: 'ms_100h', name: 'Held der Arbeit', description: 'Unglaubliche 100 Stunden investiert!', icon: '💎', type: 'milestone' },

  // Ausdauer
  { id: 'dur_2h', name: 'Kurzer Einsatz', description: '2 Stunden am Stück gewerkelt.', icon: '⏱️', type: 'endurance' },
  { id: 'dur_4h', name: 'Halbe Schicht', description: '4 Stunden Ausdauer gezeigt.', icon: '🏗️', type: 'endurance' },
  { id: 'dur_5h', name: 'Solider Einsatz', description: '5 Stunden am Stück!', icon: '🛠️', type: 'endurance' },
  { id: 'dur_6h', name: 'Workaholic', description: 'Stolze 6 Stunden durchgehalten.', icon: '🔥', type: 'endurance' },
  { id: 'dur_8h', name: 'Marathon', description: 'Ganze 8 Stunden am Stück! Fantastisch.', icon: '🏃‍♂️', type: 'endurance' },

  // Special
  { id: 'spec_early', name: 'Früher Vogel', description: 'Vor 10:00 Uhr mit der Arbeit begonnen.', icon: '🌅', type: 'special' },
  { id: 'spec_night', name: 'Nachteule', description: 'Nach 20:00 Uhr noch aktiv gewesen.', icon: '🦉', type: 'special' },
  { id: 'spec_time', name: 'Zeitmaschine', description: 'Über 24h am Stück? Du hast die Raumzeit gebrochen (oder vergessen abzustempeln)!', icon: '⏳', type: 'special' }
];

export function getActivityCategory(activityName: string | null, activitiesDict: Record<string, string[]>): string {
  if (!activityName) return 'Allgemein';
  for (const [group, acts] of Object.entries(activitiesDict)) {
    if (acts.includes(activityName)) {
      return group.replace(/^\d+\.\s*/, '');
    }
  }
  return 'Allgemein';
}
