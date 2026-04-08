export const ACTIVITIES = {
  "1. Abrissarbeiten": ["Abbau", "Demontage", "Rückbau & Aufräumen"],
  "2. Umbauarbeiten": ["Innenhofsäuberung & -herrichtung", "Vogelschutznetz", "Fenstertausch", "Klimaanlagen", "Lüftungskonzept", "Deckenarbeiten", "Elektrikerarbeiten", "Trockenbauarbeiten", "Bodenarbeiten", "Sonstige Montage-/Ausbesserungsarbeiten"],
  "3. Malerarbeiten": ["Oberflächenvorbereitung", "Erster Anstrich", "Zweiter Anstrich", "Nachbesserungen"],
  "4. Maschinen": ["Aufbau & Inbetriebnahme der Maschinen", "Maschinenschulungen"],
  "5. Webseite": ["Planung", "Design", "Programmierung", "Inhaltserstellung"],
  "6. Netzwerkarbeit": ["Behördenkontakte", "Kooperationsgespräche", "Teilnahme an Treffen"],
  "7. Allgemeine Schulungen & Arbeitstreffen": ["Planung & Vorbereitung", "Durchführung", "Arbeitstreffen"]
};

export const FLAT_ACTIVITIES = Object.values(ACTIVITIES).flat();
