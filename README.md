# Pedipalpus – Proben · 0.6.0

Pedipalpus-Charaktere importieren und ihre Proben direkt in Foundry würfeln.

## Voraussetzungen

- Foundry VTT 14
- Simple Worldbuilding
- Ucurifunke – Proben ab 1.0.8; Anbindung auch mit 1.0.14 geprüft

## Installation und Updates

Im Foundry-Setup unter **Zusatzmodule → Modul installieren** diese Manifest-URL verwenden:

```text
https://github.com/antoraxger-prog/pedipalpus-foundry/releases/latest/download/module.json
```

In der Welt **Pedipalpus – Proben** und **Ucurifunke – Proben** aktivieren. Updates werden über dieselbe Manifest-URL abgerufen. Installation und Updates übernimmt der Serverbetreiber.

## Import und Würfeln

1. Den Charakter in der Windows-App speichern.
2. Im Foundry-Charakterverzeichnis auf **Pedipalpus** klicken. Alternativ: **Einstellungen → Einstellungen konfigurieren → Pedipalpus – Proben → Proben öffnen**.
3. **JSON importieren** wählen und die gespeicherte Charakterdatei auswählen.
4. Unter **In Foundry speichern als** einen bestehenden Charakter auswählen oder einen neuen anlegen.
5. Einen Bereich auswählen oder über die Suche eine Probe finden. Das Würfelsymbol würfelt direkt; **? + Würfelsymbol** würfelt verdeckt. Das Ergebnis erscheint ohne weitere Modifikator-Abfrage im Chat.

Zum Import und Würfeln werden Besitzerrechte benötigt. Neue Charaktere benötigen zusätzlich die entsprechende Foundry-Berechtigung. Beobachter können die Proben lesen.

## Kompakte Oberfläche

Das Fenster startet mit 540 × 520 Pixeln und kann vergrößert werden. Die Probenliste scrollt im Fenster. Angezeigt werden nur vollständig definierte Attributs-, Widerstands-, Reaktions-, Fertigkeits-, Freizeit-, Zauber-, Ritual- und Wunderproben. Bereiche ohne Proben werden ausgeblendet. Die Suche durchsucht alle Bereiche. Fantasy ist die Standarddarstellung mit Holzrahmen und Pergament. Dunkel und Hell bleiben auswählbar; eine bereits gespeicherte Auswahl wird beibehalten.

Biografie, Inventar, Energien, AP-Anzeigen, Zustände und Bearbeitungsfelder sind nicht Bestandteil des Würfelfensters. Kampfproben sind noch nicht angebunden.

## Talentstärken erkennen

Das Pergament wird mit höherem Gesamtwert des Talents schrittweise heller und feiner. Wert 0 oder darunter erscheint auf abgenutztem Pergament mit gestricheltem Wertfeld. Ab 10 hebt ein Goldrahmen mit Stern das Talent hervor. Die kleine Legende und der Hinweis am Wertfeld erklären die Abstufung: 0 ungeübt, 1–3 Grundlagen, 4–6 geübt, 7–9 versiert und 10+ meisterlich. Diese Bezeichnungen dienen der Orientierung in der Oberfläche; sie ändern keine Regeln oder Würfelwerte. Attribute verwenden eine eigene Skala: 1 sehr schwach, 10 durchschnittlich und ab 20 meisterlich. Widerstands- und Reaktionsproben bleiben ohne Stärke-Einstufung.

Auch in Dunkel und Hell bleiben ungeübte und meisterliche Talente durch Wertmarkierungen erkennbar. Die Oberflächen verwenden mitgelieferte Grafiken und lokale Schriften, ohne externe Bild- oder Schriftquellen.

## Erschwernis, Erleichterung und verdeckte Proben

**Nächste Probe** gilt für genau einen Wurf und wird danach auf 0 zurückgesetzt. Das Feld zeigt den Betrag ohne Vorzeichen: rot bei Erschwernis, grün bei Erleichterung, neutral bei 0. Die Bezeichnung daneben lässt sich anklicken, um zwischen beiden Richtungen zu wechseln.

Mit dem Mausrad über dem Feld: **↑ schwerer · ↓ leichter**. Beim Scrollen durch 0 wechselt die Richtung automatisch. Der Wert lässt sich auch eintippen. Die Probenliste scrollt weiterhin, wenn sich der Zeiger außerhalb des Felds befindet.

Der zweite Knopf **? + Würfelsymbol** erzwingt einen verdeckten Wurf: Nur Spielleiter sehen das Ergebnis. Normale Würfe beachten den in Foundry eingestellten Chatmodus.

Die Auswertung übernimmt weiterhin Ucurifunke – Proben. Der Direktwurf ersetzt ausschließlich dessen Modifikator-Abfrage für den ausgewählten Wurf; andere Dialoge und manuelle Chatbefehle bleiben verfügbar. Geprüft sind die veröffentlichten Versionen 1.0.8 und 1.0.14. Bei einer neueren Version ist zuerst die Direktwurf-Anbindung zu aktualisieren; bis dahin bleiben Direktwürfe gesperrt.

## Vorhandene Charaktere und Tokens

Beim Import den vorhandenen Foundry-Charakter als Ziel auswählen. Gehört ein bestehender Token zu diesem Charakter, ihn auf der Szene auswählen. Ein passender verknüpfter Token wird als Sprecher des Wurfs verwendet.

Ist genau ein anderer oder nicht verknüpfter Token ausgewählt, erscheint **Ausgewählten Token verknüpfen**. Der Token muss demselben Charakter zugeordnet sein. Für einen Token mit eigenem Blatt ist die Übernahme des gemeinsamen Blatts zu bestätigen. Eine andere Charakterzuordnung wird zuerst in der Token-Konfiguration geändert.

Ohne passenden Token verwendet der Wurf den gewählten Foundry-Charakter als Sprecher.

## Werte aktualisieren

Werte in Pedipalpus ändern, speichern und die JSON-Datei erneut **in denselben Foundry-Charakter** importieren. Bilder, Besitzerrechte und Token-Verknüpfungen bleiben erhalten. Es gibt keine automatische Synchronisierung mit der Windows-App oder den Foundry-Ressourcenfeldern.

Vorhandene Importe aus früheren Modulversionen bleiben verwendbar; für das Update auf 0.6.0 ist kein erneuter Import erforderlich. Ein erneuter Import ersetzt auch Änderungen aus der früheren Bearbeitungsoberfläche. Die Speicherdateiversion 17 ist geprüft; andere Versionen erfordern einen Wertevergleich.

## Optionales Makro

```js
game.modules.get('pedipalpus-foundry').api.open();
```
