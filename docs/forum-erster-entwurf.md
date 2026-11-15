# Kleines Forum mit PDF-Diskussion – erster Entwurf

## Auftrag

Erweitere das bestehende MakerSpace-Webtool um einen einfachen Diskussionsbereich. Erster Anwendungsfall ist die Vorbereitung einer Mitgliederversammlung mit drei Ordnungen. Das Forum soll später auch für andere Themen nutzbar sein.

Setze nur den unten beschriebenen Umfang um. Nutze bestehendes Design, Anmeldung und Rollen. Keine Neugestaltung des gesamten Webtools.

## Ansichten und Bedienung

### 1. Themenübersicht

- Neuer Einstieg „Forum“ im Dashboard, eigene Seite `/dashboard/forum`.
- Liste mit Titel, kurzem Beschreibungstext und Kommentaranzahl je Thema.
- Admins können Themen anlegen: Titel, Beschreibung und optional ein PDF.
- Ein Thema ohne PDF zeigt den Startbeitrag und darunter die Diskussion.
- Ein Thema mit PDF öffnet die Dokumentansicht.
- Zunächst eine flache Themenliste; Kategorien und separate Versammlungsbereiche sind nicht nötig.

### 2. Dokumentansicht – zentrale Anforderung

- Desktop: PDF links (etwa zwei Drittel der Breite), Diskussion rechts.
- Dokument und Diskussion sollen gleichzeitig lesbar sein, jeweils mit sinnvoller Scrollmöglichkeit.
- PDF mit Seitenwechsel, Zoom und Download. Möglichst vorhandene Browserdarstellung nutzen; keine aufwendige eigene PDF-Engine für diesen Entwurf. Immer zusätzlich „PDF öffnen“ und „Herunterladen“ anbieten.
- Mobil: Umschalter „Dokument“ / „Diskussion“, keine schmale Zweispaltenansicht. Kommentarentwurf beim Umschalten erhalten.
- Titel und Beschreibung stehen oberhalb der Ansicht.
- Ein PDF-Ladefehler darf die Kommentarfunktion nicht blockieren.

### 3. Kommentare

- Alle angemeldeten Benutzer können Kommentare schreiben und direkt darauf antworten.
- Eine Antwortebene genügt: Antworten stehen unter dem jeweiligen Hauptkommentar.
- Chronologische Reihenfolge, älteste zuerst.
- Name und Datum anzeigen; Identität immer aus der Serversitzung beziehen.
- Optionales Freitextfeld „Bezug“, etwa „Seite 2, § 4“. Keine automatische Navigation oder Textmarkierung erforderlich.
- Eigene Beiträge können bearbeitet werden; bearbeitete Beiträge entsprechend kennzeichnen.
- Admins können Beiträge ausblenden. Antworten bleiben erhalten, an der Stelle steht „Beitrag entfernt“.
- Texte als Klartext darstellen, kein HTML zulassen.
- Beim Speichern Fehler anzeigen und den eingegebenen Text erhalten; doppeltes Absenden verhindern.

## Erste Inhalte

Die drei geprüften PDFs haben jeweils zwei Seiten. Sie dienen nur als Dokumente für die Diskussion; ihre Regeln werden in diesem Auftrag nicht als Buchungs-, Gebühren- oder Zutrittslogik umgesetzt.

| Thema | Quelldatei | Gliederung für mögliche Kommentarverweise |
| --- | --- | --- |
| Beitrags- und Gebührenordnung | `01 Beitrags- und Gebührenordnung.pdf` | Seite 1: §§ 1–3 (Beiträge, Zahlung, Zugang); Seite 2: §§ 4–6 (Maschinengebühren/Buchung, Schließfächer/Gemeinschaftsarbeit, Inkrafttreten) |
| Nutzungs- und Hausordnung | `02 Nutzungs- und Hausordnung(1).pdf` | Seite 1: §§ 1–4 (Geltung, Zeiten, Zutritt, Ordnung/Lagerung); Seite 2: §§ 5–10 (Verhalten, Minderjährige, kommerzielle Nutzung, Schäden, Maßnahmen, Inkrafttreten) |
| Maschinen- und Sicherheitsordnung | `03 Maschinen- und Sicherheitsordnung.pdf` | Seite 1: §§ 1–3 (Freigabe, Minderjährige, sicheres Arbeiten); Seite 2: §§ 4–6 (Buchung/Aufsicht, Störungen/Notfälle, Verstöße/Inkrafttreten) |

Alle drei Dokumente sind Beschlussentwürfe. Themenbeschreibung: „Entwurf zur Diskussion vor der Mitgliederversammlung. Fragen und Hinweise bitte mit Seiten- oder Paragraphenbezug kommentieren.“

PDFs über die Admin-Oberfläche hochladen. Falls die Quelldateien bei der Umsetzung nicht lokal vorliegen, keine Inhalte oder PDFs erfinden; Upload-Funktion und leeren Zustand fertigstellen. Die Dateien aus diesem Chat sind nicht automatisch im Repository vorhanden.

## Minimales Datenmodell

Neue Prisma-Modelle verwenden, vorhandene Kommentare anderer Module unverändert lassen:

- `ForumTopic`: ID, Titel, Beschreibung, Ersteller-ID, erstellt/geändert am; optional PDF-Speicherschlüssel und ursprünglicher Dateiname.
- `ForumComment`: ID, Themen-ID, Benutzer-ID, optional Hauptkommentar-ID, Inhalt, optional Bezug, erstellt/geändert am, optional Ausblendzeitpunkt.
- Antworten müssen zum selben Thema gehören und direkt auf einen Hauptkommentar zeigen. Keine weiteren Verschachtelungen.
- Relationen und Indizes für Themenkommentare und Antworten ergänzen.

## Technische Einbindung

Bestand bei der Planung: Next.js 16.3.8, React 19, Prisma 6 mit SQLite. Rollen: `USER` und `ADMIN`.

Vor dem Implementieren `AGENTS.md` und relevante lokale Next.js-Dokumentation unter `node_modules/next/dist/docs/` lesen.

Relevante bestehende Dateien:

- `src/app/dashboard/page.tsx`: Einstieg ergänzen.
- `src/app/globals.css`: Gestaltung übernehmen; neue Styles möglichst im eigenen CSS-Modul.
- `prisma/schema.prisma`: neue Modelle ergänzen.
- `src/lib/session.ts`: `getSession()` für verbindliche Identität.
- `src/lib/api-access.ts`: vorhandener `secureRoute`-Schutz und explizite Routenberechtigungen.
- `tests/security.test.mjs`: bestehende Sicherheitstests berücksichtigen.

Neue Seiten: `/dashboard/forum` und `/dashboard/forum/[id]`. Kleine Komponenten für Themenliste, Dokumentansicht und Kommentarbereich verwenden.

API unter `/api/forum`: Themen lesen/anlegen, Thema lesen, Kommentare anlegen/bearbeiten/ausblenden sowie geschützter PDF-Abruf. Endpunktaufteilung passend zu bestehenden Konventionen wählen.

Wichtig: `secureRoute` akzeptiert derzeit ausschließlich JSON-Bodies. PDF-Uploads benötigen eine ausdrücklich begrenzte Multipart-Unterstützung. Anmeldung, Origin-Prüfung und Adminprüfung müssen vor Verarbeitung des Uploads greifen. Den Schutz nicht umgehen und bestehende JSON-Routen nicht lockern. Neue Routen in der Zugriffspolitik explizit berücksichtigen; bisher unbekannte Routen werden abgelehnt.

## PDF-Speicherung und Rechte

- Lesen und Kommentieren: alle angemeldeten Benutzer. Keine zusätzliche Mitgliedschaftsprüfung in diesem Entwurf.
- Themen anlegen und PDFs hochladen: nur Admins.
- Pro Thema maximal ein PDF, maximal 10 MB. Typ, Dateisignatur und tatsächliche Größe serverseitig prüfen; nur auf Dateiendung zu vertrauen reicht nicht.
- Dateien außerhalb von `public` speichern, mit serverseitig erzeugtem Speicherschlüssel. Keine vom Benutzer vorgegebenen Dateipfade verwenden.
- PDF-Zugriff nur über einen authentifizierten Endpunkt mit `application/pdf`, sicherem Dateinamen und privatem Cache-Verhalten.
- Uploadverzeichnis konfigurierbar machen und für Produktion auf persistentem Speicher vorsehen. Datenbank und Uploads müssen gemeinsam gesichert werden.
- Bei fehlgeschlagenem Anlegen keine verwaisten Uploads hinterlassen.
- Titel, Kommentare und Bezug mit serverseitigen Längenlimits validieren (z. B. 160, 5.000 und 120 Zeichen).

## Klarstellungen fuer die Umsetzung

- Admins koennen Titel und Beschreibung bestehender Themen korrigieren. Die PDF-Datei bleibt unveraendert. Dafuer einen geschuetzten Bearbeitungsendpunkt und eine kleine Bearbeitungsmaske vorsehen.
- Ausgeblendete Kommentare serverseitig ohne urspruenglichen Inhalt und Bezug ausliefern, nicht nur per CSS verstecken. Sie sind nicht mehr bearbeitbar; vorhandene Antworten bleiben sichtbar. Neue Antworten auf ausgeblendete Hauptkommentare ablehnen. Die Kommentaranzahl zaehlt nur sichtbare Kommentare und Antworten.
- Native PDF-Einbettung ist browserabhaengig: Seitenwechsel und Zoom stammen im ersten Entwurf aus dem Browser-Viewer. Falls dieser mobil fehlt, muss das Dokument ueber den separaten Oeffnen-/Download-Link erreichbar sein. Keine identische integrierte Toolbar auf allen Geraeten versprechen. Darstellung mindestens in einem Desktop- und einem mobilen Browser pruefen.
- Titel und Kommentar duerfen nach Trimmen nicht leer sein. Beschreibung auf 10.000 Zeichen begrenzen. Den gesamten Upload-Request vor unbegrenztem Einlesen begrenzen (10 MB Datei plus begrenzter Multipart-Overhead); Content-Length allein ist keine verlaessliche Groessenpruefung.
- Bei geloeschten Benutzerkonten sollen Diskussionen erhalten bleiben: optionale Benutzerrelation mit SetNull und Anzeige "Geloeschter Benutzer" vorsehen. Keine Kaskadenloeschung von Themen oder Kommentaren beim Loeschen eines Benutzers.

## Bewusst spaeter (Umfang unveraendert)

Keine Kategorien, Suche, Likes, Abstimmungen, Benachrichtigungen, Lesestände, Dokumentversionen, Statusworkflows, Beschlussverwaltung oder PDF-Annotationen. PDF-Austausch zunächst nicht anbieten, damit sich alte Kommentare nicht unbemerkt auf einen veränderten Text beziehen. Keine E-Mails versenden.

## Umsetzung in vier Schritten

1. Modelle und nichtdestruktive Datenbankvorbereitung, abgesicherte API und Uploadspeicherung.
2. Themenübersicht und Adminformular inklusive PDF-Upload.
3. Normale Themenansicht, PDF-Zweispaltenansicht und Kommentare mit Antworten.
4. Rechte, Fehlerfälle und mobile Bedienung prüfen; kurze Start-/Speicherhinweise dokumentieren.

Vorhandene uncommittete Änderungen anderer Aufgaben erhalten. Keine Datenbank zurücksetzen, kein Deployment durchführen. Neue Tabellen nach den bestehenden Projektkonventionen bereitstellen, ohne bestehende Daten zu verlieren.

## Fertig, wenn

- Ein Admin ein Thema mit und ohne PDF anlegen kann.
- Die drei Ordnungen jeweils als eigenes Thema hochgeladen werden können.
- Am Desktop PDF und Kommentare nebeneinander nutzbar sind; mobil funktioniert die Umschaltung.
- Benutzer kommentieren, antworten und eigene Beiträge bearbeiten können.
- Fremde Beiträge nicht bearbeitbar sind; Ausblenden nur als Admin möglich ist.
- Unangemeldete Zugriffe auch auf PDF-Dateien abgewiesen werden.
- Ungültige/zu große Uploads und Antworten auf Kommentare anderer Themen abgewiesen werden.
- Daten und Dateien einen Neustart überstehen.
- Build und relevante Sicherheitsprüfungen bestehen; bestehende Fehler getrennt dokumentieren. Tests mit separater Testdatenbank und temporärem Uploadverzeichnis ausführen.

Priorität: ein kleiner, funktionierender erster Entwurf mit guter Dokumentansicht. Zusätzliche Funktionen erst nach Nutzerfeedback.
