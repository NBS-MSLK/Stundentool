# Anschaffungen und Ausstattung

„Anschaffungen“ enthält die Planung und das Budget. Als `PURCHASED` markierte
Einträge erscheinen unter „Ausstattung“. Abgeschlossene Kategorien werden in
der Anschaffungsansicht ausgeblendet. Die zugrunde liegenden Datensätze bleiben
erhalten, damit Mengen und Zubehör weiterhin im Budget berücksichtigt werden.

`npm run dev` und `npm start` führen vor dem Serverstart die additive,
wiederholbar ausführbare Vorbereitung `scripts/prepare-inventory.mjs` aus.
Bei einem eigenen Startbefehl zuerst `npm run db:inventory` mit der Datenbank
der jeweiligen Umgebung ausführen. Ein Build allein verändert die Datenbank nicht.

Die Vorbereitung übernimmt vorhandene angeschaffte Einträge in Reihenfolge
von Erstellungsdatum und ID. SQLite-Trigger vergeben bei späteren Anschaffungen
atomar eine Nummer, auch bei Änderungen im Adminbereich. Eine Nummer gehört
zu einer Inventarposition mit Mengenangabe. Sie bleibt bei Statuswechseln gleich
und wird nach dem Löschen nicht erneut vergeben. Die Liste zeigt nur aktuell
als angeschafft markierte Positionen. Zurückgesetzte Statuswerte werden wieder
in der Anschaffungsansicht sichtbar.

Die Trigger sind Teil der Vorbereitung, nicht der Prisma-Schemadefinition.
Nach manuellen Schemaänderungen oder `prisma db push` die Vorbereitung erneut
ausführen.

Prüfung: `node --test tests/inventory.test.mjs` (Node mit `node:sqlite` und
TypeScript-Unterstützung), `npm run build`.
