# Sicherheitsupdate: Zugriffsschutz und Passwort-Hashes

Stand: 03.10.2026. Veröffentlicht werden Schritt 1 und 2 gemeinsam.

## Passwortumstellung

Die zusätzliche optionale Spalte `User.passwordHash` enthält scrypt-Hashes mit zufälligem 16-Byte-Salt (N=32768, r=8, p=3, 32-Byte-Schlüssel; OWASP-Profil). Das bisherige Passwort wird nach erfolgreicher Hash-Verifikation atomar geleert. Ein zusätzliches Feld vermeidet Verwechslungen zwischen alten Passwörtern und Hash-Formaten. Vorhandene Passwörter bleiben für die Anmeldung unverändert; Konten ohne Passwort bleiben gesperrt.

Beim Start laufen ausschließlich die additive Sitzungstabellen-Ergänzung und `scripts/migrate-passwords.mjs`. Letzteres erstellt vor der ersten Änderung ein zusätzliches konsistentes SQLite-Backup auf dem Volume. Die unabhängig heruntergeladene Sicherung bleibt erforderlich. Die Migration lässt sich wiederholen und startet die Anwendung nicht, solange Klartext-Passwörter in `User` verbleiben. Alle anderen Datensätze bleiben erhalten.

Neue Konten und Passwortänderungen schreiben ausschließlich Hashes. Die API gibt weder Passwörter noch Passwort-Hashes aus. Eine Passwortänderung widerruft alle Sitzungen des betroffenen Kontos. Zwanzig fehlgeschlagene Anmeldeversuche pro Kontoname innerhalb von 15 Minuten führen vorübergehend zu HTTP 429. Diese Begrenzung gilt für die aktuelle einzelne Anwendungsinstanz und wird bei einem Neustart zurückgesetzt.

## Deployment

- Frisches externes Backup: `C:\Users\Nils\Stundentool-Backups\2026-10-03\database.sqlite`.
- Vor der Umstellung: 13 Benutzer, 229 Zeiteinträge; alle 13 bisherigen Passwörter an einer migrierten Kopie erfolgreich geprüft.
- Railway-Startbefehl muss `npm start` lauten, ohne vorgeschaltetes `prisma db push`.
- `DATABASE_URL=file:/app/data/database.sqlite` und Volume `/app/data` beibehalten.
- Ursprung für CSRF: `APP_ORIGIN` oder von Railway gesetztes `RAILWAY_PUBLIC_DOMAIN`. Benutzer melden sich nach dem Update einmal neu an. Sitzungslaufzeit weiterhin sieben Tage.
- Login, autorisierte Lesezugriffe, Logout und Ablehnung unangemeldeter API-Aufrufe nach dem Deployment prüfen.

## Rückweg und Grenzen

Nach der Hashmigration darf die alte unsichere Version NICHT einfach wieder gestartet werden: Sie versteht Hashes nicht und könnte leere Legacy-Passwörter als Einladung zur Kontoübernahme behandeln. Bei einem Fehler vorwärts mit einer korrigierten Version reparieren. Eine Wiederherstellung des alten Datenbankstands erfordert eine Schreibpause und würde spätere Eingaben verwerfen; sie ist kein automatischer Rollback.

`.env` und `database.sqlite` sind aus der aktuellen Git-Version entfernt, bleiben lokal erhalten und werden künftig ignoriert. Frühere Git-Commits sowie alte Backups können weiterhin Klartext-Passwörter enthalten. Dieses Update bereinigt nicht die Git-Historie und ersetzt keine bereits offengelegten Passwörter.

## Tests

`npm run test:security`, `npm run build` und die gezielte ESLint-Prüfung der neuen Sicherheitsdateien. Zusätzlich `node scripts/verify-security-migration.mjs <backup.sqlite>`: arbeitet ausschließlich auf einer temporären Kopie, vergleicht alle bisherigen Geschäftsdaten, prüft alle alten Passwörter gegen die neuen Hashes und führt beide Migrationen zweimal aus.

Die übrigen Review-Befunde werden separat bearbeitet, insbesondere anonyme Umfragen, fachliche Zeitvalidierung und transaktionales Benutzerlöschen.
