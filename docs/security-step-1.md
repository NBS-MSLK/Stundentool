# Schritt 1: Anmeldung und API-Zugriffsschutz

## Verhalten

- Die Anmeldung erstellt eine sieben Tage gültige serverseitige Sitzung. Im Browser liegt nur ein zufälliger HttpOnly-Cookie, in SQLite nur dessen SHA-256-Hash. In Produktion ist der Cookie Secure.
- Jede bestehende API-Operation außer Anmeldung/Sitzungsabfrage/Abmeldung prüft die Sitzung. Die Rolle wird bei jedem Aufruf aus der Datenbank gelesen. localStorage enthält nur zwischengespeicherte Anzeigedaten.
- Logout widerruft die aktuelle Sitzung. Passwortänderungen widerrufen alle Sitzungen des betroffenen Kontos. Konten mit leerem Passwort können nicht mehr durch die erste beliebige Anmeldung übernommen werden; ein Administrator muss ein Startpasswort setzen.
- Benutzername und mitgesendete Rollen verleihen keine Rechte. Vorhandene Rollen bleiben unverändert.
- Schreibende Aufrufe verlangen einen passenden Origin-Header; fremde Browser-Ursprünge werden abgewiesen. JSON-Anfragen werden vor der Rechteprüfung eingelesen, auch bei DELETE.
- Passwörter werden zentral aus Prisma-Benutzerabfragen ausgeschlossen, einschließlich verschachtelter Relationen. Nur die Anmeldung liest sie ausdrücklich. Die bestehende Klartextspeicherung wird in Schritt 2 ersetzt.

## Rechte

| Bereich | Mitglieder | Administratoren |
| --- | --- | --- |
| Zeiten | Eigene lesen, erstellen und bearbeiten; eingereichte/archivierte Zeiten nicht verändern | Alle Zeiten, Archivierung und Einreichungsstatus |
| Profile | Eigenes Profil und eigenes Passwort | Alle Profile, Konten anlegen/löschen, Passwörter setzen |
| Benutzerliste, Aktivitätslog | Gesperrt | Erlaubt |
| Meldungen, Nachrichten, FAQ, Umfragen, Förderung | Lesen; als man selbst abstimmen | Inhalte/Finanzen verwalten |
| Aufgaben | Erstellen; eigene bearbeiten/löschen; gemeinsam Schritte/Material abhaken, Termine vorschlagen; eigene Teilnahme, Notizen und Abos | Zusätzlich fremde Aufgaben verwalten |
| Ausstattung | Vorschläge/Kategorien erstellen; eigene bearbeiten/löschen; eigene Notizen und Stimmen | Budget, Reihenfolge, Gruppen, Nummerierung und Kaufstatus verwalten |
| Seed-Web-Endpunkt | Gesperrt | Gesperrt (schreibender GET darf nicht durch Cookie-Anmeldung erreichbar bleiben) |

Verschachtelte Schritt-, Material- und Terminvorschlag-IDs werden gegen die übergeordnete Aufgabe geprüft. Neue API-Routen müssen einen expliziten Eintrag in `src/lib/api-access.ts` erhalten und `secureRoute` benutzen.

## Datenbank und Start

`npm start` führt ausschließlich `scripts/prepare-session-table.mjs` und anschließend Next.js aus. Das Skript ergänzt die Tabelle `Session` und ihre Indizes. Es synchronisiert keine bestehenden Tabellen, löscht keine Geschäftsdaten und bricht ab, wenn die Tabelle `User` fehlt. Das bisherige `db push --accept-data-loss` entfällt. Zukünftige Schemaänderungen benötigen eigene geprüfte Migrationen.

Lokal bei einer bestehenden Entwicklungsdatenbank: `npm run db:session` (DATABASE_URL muss auf diese Entwicklungsdatenbank zeigen), danach `npm run dev`.

## Vor Veröffentlichung auf Railway

1. Frisches konsistentes Datenbankbackup erstellen, herunterladen und prüfen.
2. Sicherstellen, dass die produktive Datenbank auf `/app/data/database.sqlite` liegt und die vorhandene Administratorrolle korrekt gesetzt ist.
3. Bei einer eigenen Domain `APP_ORIGIN` auf den vollständigen HTTPS-Ursprung ohne abschließenden Slash setzen. Ohne diese Variable verwendet die Anwendung `https://RAILWAY_PUBLIC_DOMAIN`, wenn Railway die öffentliche Domain bereitstellt. Nur bei lokaler Entwicklung ist der Request-Ursprung der Fallback.
4. Railway muss `npm start` verwenden; einen eventuell im Dashboard hinterlegten alten Startbefehl mit `db push --accept-data-loss` ersetzen. Build: `npm run build`.
5. Änderung über den geprüften GitHub-Branch veröffentlichen. Nutzer müssen sich danach einmal neu anmelden. Bestehende Passwörter bleiben gültig, sofern sie nicht leer sind.
6. Anmeldung, eigene Zeiterfassung, Adminansicht, Abmeldung und Ablehnung eines unangemeldeten API-Aufrufs prüfen.

Die additive Sitzungstabelle kann bei einem Code-Rollback bestehen bleiben. Ein Rollback auf den alten Code bringt die alten Sicherheitslücken zurück. Ein Datenbank-Restore überschreibt nach dem Backup entstandene Eingaben und darf nicht unüberlegt ausgeführt werden.

## Prüfung

- `npm run test:security`: echte HTTP-Tests mit isolierter temporärer SQLite-Datenbank und lokalen Testkonten ohne Mailadressen; keine produktiven API-Aufrufe.
- `npm run build`: Produktionsbuild mit TypeScript-Prüfung.
- Ergänzen der Sitzungstabelle an einer Kopie des Backups vom 21.09.2026 geprüft: alle 26 bestehenden Tabellen inhaltlich unverändert, Integritätsprüfung erfolgreich; zweimalige Ausführung erfolgreich.

Noch nicht Teil dieses Schritts: Passwort-Hashmigration, Anonymität der Umfragen, weitere fachliche Validierungen und die übrigen Review-Befunde. Ein vollständiger Anwendungstest der Backup-Kopie wurde nicht durchgeführt.
