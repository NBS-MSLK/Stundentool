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

## Inventar verwalten

Administratoren können Inventarnummern ändern, Inventarkategorien anlegen und
Positionen über „Verschieben“ einer Kategorie zuweisen. Die Nummer bleibt eine
positive ganze Zahl mit der Anzeige `INV-…`. Bereits belegte Nummern werden mit
einer Fehlermeldung abgelehnt; der Datenbank-Primärschlüssel verhindert auch bei
gleichzeitigen Änderungen Duplikate. Manuell freigegebene Nummern können erneut
zugewiesen werden.

Inventarkategorien sind unabhängig von Anschaffungskategorien und werden
alphabetisch sortiert, die Gegenstände darin nach Inventarnummer. Bei der ersten
Vorbereitung werden bestehende Positionen anhand ihrer Anschaffungskategorie
gruppiert: etwa „1.2 Holzwerkstatt: Sägen“ unter „Holzwerkstatt“. Spätere neue
Positionen erscheinen unter „Nicht zugeordnet“, bis sie zugewiesen werden.
Manuelle Zuordnungen bleiben bei Neustarts erhalten. Das Verschieben verändert
weder die ursprüngliche Anschaffungskategorie noch deren Budget.

Kategorien lassen sich als Administrator umbenennen und nach Bestätigung löschen.
Beim Löschen werden ausschließlich die Kategorie und ihre Zuordnungen entfernt;
Gegenstände, Inventarnummern und Anschaffungskosten bleiben erhalten. Die
betroffenen Gegenstände erscheinen anschließend unter „Nicht zugeordnet“.

## Orte

Orte werden unabhängig von Kategorien gespeichert. Holzwerkstatt,
Elektronikbereich, Kreativraum und Keller sind vorbelegt. Die Vorbereitung
legt keine Ortszuordnungen für Gegenstände an und erhält bestehende Zuordnungen.
Administratoren können weitere Orte hinzufügen und über die Spalte „Ort“
zuordnen oder die Zuordnung entfernen. Mitglieder sehen die Orte, dürfen sie
aber weder anlegen noch zuweisen. Eine Inventarposition mit mehreren Stück
hat einen gemeinsamen Ort.
