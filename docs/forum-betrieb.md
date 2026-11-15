# Forum: erster Entwurf

## Aktueller Prüfstand (15.11.2026)

Produktionsbuild, TypeScript, direkte Forumtests und die Sicherheitssuite im Produktionsmodus bestanden (22 Tests; 77 API-Handler auf unangemeldeten Zugriff geprüft). Alle Tests verwenden separate temporäre SQLite-Datenbanken und Uploadverzeichnisse. Der Testserver setzt APP_ORIGIN ausdrücklich auf seine lokale Adresse.

Lokale HTTP-Verbindungen sind innerhalb der Agent-Sandbox gesperrt, funktionieren aber mit genehmigter Ausführung außerhalb der Sandbox. Dort wurden Build und Integrationstests erfolgreich abgeschlossen.

Browserprüfung bestanden: Admin-Anmeldung, PDF-Upload, Kommentar, Mitgliedsantwort, Bearbeitung sowie responsive Umschaltung bei 390 Pixel Breite mit erhaltenem Kommentarentwurf. Die sichtbare PDF-Darstellung einschließlich Seitenwahl und Zoom bleibt offen: Der eingebettete Testbrowser zeigte keinen PDF-Inhalt; die zusätzliche Prüfung im normalen Browser wurde durch die Browsersteuerung blockiert. Ein echter mobiler Browser wurde nicht geprüft.

Die Veröffentlichung des Codes wurde vom Nutzer trotz dieser dokumentierten Restprüfung freigegeben. Die drei Ordnungen werden ausdrücklich noch nicht eingepflegt; der Nutzer lädt sie später selbst hoch. Testdaten und Test-PDFs werden nicht veröffentlicht.

Einstieg: Dashboard → Forum. Admins legen Themen an und laden optional ein PDF hoch.

## Einrichtung

- Nach Installation einmal npx prisma generate ausführen.
- npm run db:forum legt ausschließlich neue Forumtabellen und Indizes an. Die Vorbereitung läuft auch vor npm run dev und npm start. Kein Datenbankreset nötig.
- FORUM_UPLOAD_DIR bezeichnet ein absolutes persistentes Verzeichnis für PDFs. Ohne explizite Einstellung werden PDFs bei absolutem SQLite-Datenbankpfad im benachbarten Verzeichnis forum-uploads gespeichert (Railway: /app/data/forum-uploads). Nur in der Entwicklung ohne absoluten Datenbankpfad gilt uploads/forum im Projektverzeichnis. In Produktion wird eine fehlende dauerhafte Pfadkonfiguration abgewiesen. Dieses Verzeichnis ist von Git ausgeschlossen.
- Im Produktionsbetrieb muss FORUM_UPLOAD_DIR auf ein beschreibbares, dauerhaftes Volume zeigen. Datenbank und PDF-Verzeichnis zusammen sichern und wiederherstellen. Alle App-Instanzen benötigen denselben Speicher.
- Der maximale PDF-Upload beträgt 10 MiB; der gesamte Multipart-Request ist ebenfalls begrenzt. Proxy-Limits bei Bedarf passend konfigurieren.

## Umfang

Alle angemeldeten Konten lesen und kommentieren. Admins legen Themen an, bearbeiten Titel/Beschreibung und blenden Kommentare aus. Admins können unter „Thema bearbeiten“ optional ein neues PDF hochladen. Ohne Dateiauswahl bleibt das bisherige PDF unverändert. Beim Ersetzen bleiben Kommentare erhalten; sie können sich auf die vorherige Fassung beziehen. Antworten sind eine Ebene tief. Die PDF-Vorschau verwendet den Browser; besonders mobil bei Bedarf den Link PDF öffnen verwenden.

## Prüfung

npm run build, npx tsc --noEmit und npm run test:security. Die Sicherheitstests verwenden eine eigene Datenbank und einen temporären PDF-Speicher. Der Forumtest prüft Anmeldung, Admin-Upload, geschützten PDF-Abruf, Kommentarbesitz und Moderation.

## Korrektur der PDF-Speicherung (15.11.2026)

Der bisherige Standard uploads/forum lag ohne FORUM_UPLOAD_DIR im austauschbaren App-Dateisystem. Nach einem Deployment konnte daher der Datenbankeintrag erhalten bleiben, während die PDF-Datei fehlte. Der Standard folgt jetzt dem absoluten SQLite-Datenbankpfad auf das persistente Volume. Bereits fehlende Dateien müssen aus dem Original oder einem Backup unter ihrem bestehenden Speicherschlüssel wiederhergestellt werden; Themen und Kommentare dürfen dafür nicht gelöscht werden. Explizit konfigurierte Uploadpfade bleiben unverändert.

Fehlendes PDF wiederherstellen: Bestehendes Thema öffnen → Thema bearbeiten → Neues PDF wählen → Speichern. Das Thema und seine Kommentare bleiben erhalten; keine Neuanlage erforderlich. Neue Dateien werden vor Aktualisierung des Datenbankverweises vollständig gespeichert.
