# Sicherheitsprüfung der Inventarverwaltung – 10.10.2026

Geprüft wurden die neuen Inventar- und Kategorie-Endpunkte, ihre Anbindung an
`secureRoute`, Eingabevalidierung, Datenbankzugriffe und die React-Ausgabe.
In diesem Umfang wurde keine neue ausnutzbare Sicherheitslücke festgestellt.
Dies ist keine vollständige Prüfung der gesamten Anwendung oder Infrastruktur.

## Ergebnisse

- Änderungen erfordern eine serverseitig geprüfte Admin-Sitzung. Anzeigen ist
  für angemeldete Mitglieder möglich. Alle 73 API-Handler weisen anonyme
  Zugriffe im Integrationstest zurück.
- Fremde Origins, Identitätsfälschung und unzulässige Eingaben werden abgewiesen.
- Variablen in SQL werden parametrisiert; ein SQL-artiger Kategoriename wird
  im Test ausschließlich als Text gespeichert. Die Oberfläche rendert Namen
  als React-Text, ohne HTML einzufügen.
- Nummernkonflikte werden atomar über den Primärschlüssel verhindert.
- Kategorien werden innerhalb einer Transaktion gelöscht. Dabei bleiben
  Gegenstände, Inventarnummern, Materialdaten und Kosten unverändert.
- 20 Sicherheits-, Passwort- und Inventartests erfolgreich; Produktionsbuild
  erfolgreich. ESLint für die neuen Endpunkte und die Inventaroberfläche erfolgreich.

## Abhängigkeiten und offene Befunde

Kompatible Updates für baseline-browser-mapping, source-map-js, @babel/core,
@humanfs/node, brace-expansion, browserslist und js-yaml wurden eingespielt.

Der vollständige npm-Audit meldet danach weiterhin **8 hohe Befunde** in zwei
Abhängigkeitsketten, einschließlich ihrer übergeordneten Pakete:

- `deepmerge-ts → @prisma/config → prisma`: 3 Meldungen, auch im Scan mit
  `--omit=dev`. [Advisory GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx)
  beschreibt Stack-Erschöpfung beim Zusammenführen rekursiver Objekte.
  Der installierte Prisma-Konfigurationscode importiert deepmerge-ts; die
  Inventar-Endpunkte nehmen keine Prisma-Konfiguration vom Nutzer entgegen.
  Ein auslösender Web-Eingabepfad wurde im geprüften Code nicht festgestellt.
- `braces → micromatch → fast-glob → @next/eslint-plugin-next → eslint-config-next`:
  5 Meldungen in Entwicklungswerkzeugen.
  [Advisory GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
  betrifft Stack-Erschöpfung durch tief verschachtelte Muster.

npm schlägt dafür inkompatible Rücksprünge auf Prisma 6.12.0 beziehungsweise
eslint-config-next 14.2.35 vor. Diese wurden nicht automatisch ausgeführt.
Die Befunde bleiben offen; eine kompatible Behebung muss separat geprüft werden.
