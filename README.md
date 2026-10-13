# Pedipalpus – Charaktere · 0.3.1

Pedipalpus-Charaktere in Foundry importieren, mit Tokens verbinden und direkt würfeln.

## Voraussetzungen

- Foundry VTT 14
- Simple Worldbuilding
- Ucurifunke – Proben ab Version 1.0.8

Testversion für eure Foundry-Testwelt. Die Anbindung unterstützt Ucurifunke – Proben 1.0.8 und 1.0.14.

## Installation

1. Im Foundry-Setup unter **Zusatzmodule → Modul installieren** diese Manifest-URL einfügen:
   ```text
   https://github.com/antoraxger-prog/pedipalpus-foundry/releases/latest/download/module.json
   ```
2. Das Modul installieren und die Welt öffnen.
3. Unter **Einstellungen → Module verwalten** die Module **Pedipalpus – Charaktere** und **Ucurifunke – Proben** aktivieren.

Updates können über Foundrys Modulverwaltung abgerufen werden. Alternativ das ZIP aus dem GitHub-Release entpacken und den Ordner `pedipalpus-foundry` nach `Data/modules/` kopieren; danach Foundry neu starten. Die Datei muss unter `Data/modules/pedipalpus-foundry/module.json` liegen.

## Charakter importieren

1. Den Charakter in der Windows-App speichern.
2. In Foundrys Charakterverzeichnis auf **Pedipalpus** klicken. Alternativ: **Einstellungen → Einstellungen konfigurieren → Pedipalpus – Charaktere → Charaktere öffnen**.
3. **Charakter importieren** wählen und die gespeicherte JSON-Datei auswählen.
4. Unter **In Foundry speichern als** einen vorhandenen Charakter auswählen oder einen neuen anlegen.

Zum Import und Würfeln werden Besitzerrechte auf dem Charakter benötigt. Neue Charaktere können nur mit entsprechender Foundry-Berechtigung angelegt werden. Der Meister kann den Import übernehmen und anschließend Besitzerrechte vergeben.

## Würfeln und Oberfläche

Die Reiter und Kategorien entsprechen dem Pedipalpus-Charaktereditor. Unter **Mundane Fertigkeiten → Allgemeine Fertigkeiten** eine Kategorie wählen und auf das Würfelsymbol neben dem Gesamtwert klicken. Die Suche durchsucht alle Kategorien.

Der Ucurifunke-Proben-Dialog öffnet sich für Erschwernis, Erleichterung und verdeckte Proben. Nach Bestätigung erscheint das Ergebnis im Foundry-Chat. Unter **Darstellung** kann jeder Spieler zwischen hellem und dunklem Design wechseln.

Unterstützt werden Attributs- und Fertigkeitsproben sowie Zauber, Wunder und Rituale mit vollständig definierten Probenattributen. Kampfproben sind im Charakterblatt noch nicht angebunden. Nicht definierte Proben sind deaktiviert.

## Tokens verbinden

Neue Charaktere erhalten einen verknüpften Prototyp-Token. Den Charakter aus dem Verzeichnis auf die Szene ziehen und seinen Token auswählen, damit dieser als Sprecher des Wurfs verwendet wird.

Für bestehende Tokens den passenden Charakter im Modul auswählen, genau einen Token markieren und **Ausgewählten Token verknüpfen** anklicken. Der Token muss demselben Foundry-Charakter zugeordnet sein. Gehört er einem anderen Charakter, zuerst seine Zuordnung in der Token-Konfiguration ändern. Ein nicht verknüpfter Token desselben Charakters kann nach Bestätigung auf das gemeinsame Blatt umgestellt werden.

Ohne passenden ausgewählten Token verwendet der Wurf den gewählten Foundry-Charakter als Sprecher.

## Änderungen übernehmen

Werte in Pedipalpus bearbeiten, speichern und die neue JSON-Datei **in denselben Foundry-Charakter** importieren. Das Pedipalpus-Blatt wird ersetzt; Bilder, Berechtigungen, Token-Verknüpfungen und andere Foundry-Daten bleiben erhalten.

Besitzer können Werte direkt in den Feldern ändern und mit **Änderungen speichern** übernehmen oder mit **Änderungen verwerfen** zurücksetzen. Bearbeitbar sind Energien, Willenskraft, AP, Attribute, Fertigkeitswerte, Zustände, Geld, vorhandene Ausrüstung, Charakterangaben, Tagebuch sowie vorhandene Vor- und Nachteile und Sonderfertigkeiten. Vor einem Wurf werden Änderungen gespeichert.

Attributsänderungen werden in die Probenattribute übernommen. Geänderte Grundlagen- und Spezialisierungswerte aktualisieren die Gesamtwerte der betroffenen Fertigkeiten. AP-Kosten, weitere Regelableitungen und Kaufabrechnungen müssen bei manuellen Änderungen selbst angepasst werden. Beobachter können das Blatt lesen, aber weder Werte speichern noch würfeln.

Die Änderungen werden am Foundry-Charakter gespeichert. Eine automatische Synchronisierung mit der Windows-App oder Foundrys Ressourcenfeldern ist noch nicht enthalten. Ein erneuter JSON-Import ersetzt auch Änderungen aus Foundry. Neue Einträge werden weiterhin in der Windows-App angelegt.

Beim Update den Modulordner durch den neuen ZIP-Inhalt ersetzen und Foundry neu starten. Nach einem Update von 0.1.0 auf 0.2.0 die Charakterdatei erneut importieren, um zusätzliche Daten anzuzeigen.

Die Pedipalpus-Speicherdateiversion 17 ist geprüft. Bei anderen Versionen die angezeigten Werte vor Verwendung vergleichen.

## Optionales Makro

Ein Foundry-Skriptmakro kann die Oberfläche öffnen:

```js
 game.modules.get('pedipalpus-foundry').api.open();
```
