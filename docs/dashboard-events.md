# Dashboard, Termine und LEADER-Förderung

Die Übersicht zeigt zuerst allgemeine Termine und Nachrichten. Administratoren können Termine direkt dort anlegen, bearbeiten und löschen. Alle angemeldeten Mitglieder können sie lesen. Datum und Uhrzeit beziehen sich auf Europe/Berlin; Termine bleiben am Veranstaltungstag sichtbar. Vergangene Termine lassen sich einblenden. Die bisherigen Arbeitseinsätze und Terminvorschläge bleiben separat erhalten.

Förderkacheln und gemeinsames Stundenziel stehen unter `/dashboard?tab=LEADER` (Sidebar: LEADER-Förderung).

## Betrieb

`npm start` und der in `railway.json` festgelegte Startbefehl nutzen `scripts/start.mjs`. Der Start führt die bisherigen Vorbereitungen und anschließend die additive, wiederholbare Terminmigration aus. Kein `prisma db push` auf der Produktionsdatenbank erforderlich.

Der Startprozess leitet SIGTERM/SIGINT an Next.js weiter und wartet auf dessen Ende. Next.js 16.3.8 beendet den regulären Shutdown mit 143/130; diese Codes werden als Erfolg (0) behandelt. Andere Fehlercodes bleiben Fehler. Railway sollte ausreichend Zeit für den regulären Shutdown lassen.

Vor jedem Push Produktionsbuild prüfen: `npm run build`. Falls Turbopack lokal unter Windows beim Start des CSS-Unterprozesses abstürzt, mit `npm run build -- --webpack` prüfen. Danach Sicherheitstests gegen diesen Build mit `SECURITY_TEST_MODE=production` und `npm run test:security` ausführen. Ergänzend: `node --test tests/shutdown.test.mjs tests/events-migration.test.mjs`.
