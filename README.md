# Pedipalpus – Proben · 0.9.0

Pedipalpus-Charaktere importieren und ihre Proben direkt in Foundry würfeln.

## Voraussetzungen

- Foundry VTT 14
- Simple Worldbuilding
- Ucurifunke – Proben 1.0.14 für Kampf- und Tierproben; ohne diese Proben bleiben 1.0.8–1.0.14 nutzbar

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

Das Fenster startet mit 540 × 520 Pixeln und kann vergrößert werden. Die Probenliste scrollt im Fenster. Angezeigt werden nur vollständig definierte Attributs-, Widerstands-, Reaktions-, Fertigkeits-, Freizeit-, Zauber-, Ritual- und Wunderproben. Bereiche ohne Proben werden ausgeblendet. Die Suche durchsucht alle Bereiche. Fantasy mit Holzrahmen und Pergament ist der Standard für neue Benutzer. Dunkel, Hell und Ork bleiben auswählbar. Die zuletzt gewählte Darstellung wird pro Foundry-Benutzer in der Welt gespeichert und beim nächsten Öffnen sowie auf anderen Geräten wieder verwendet. Beim ersten Öffnen nach dem Update wird die bisherige Browserauswahl einmalig für diesen Benutzer übernommen; andere Benutzer erhalten Fantasy, bis sie selbst eine Darstellung auswählen.

Biografie, Inventar, Energien, AP-Anzeigen, Zustände und Bearbeitungsfelder sind nicht Bestandteil des Würfelfensters. Kampf- und Tierproben stehen als eigene Bereiche zur Verfügung.

## Ork-Darstellung

Unter **Darstellung → Ork** wird das Fenster zu einer groben Holz- und Lederoberfläche mit Knochen, Stoßzähnen und einfachen Beschriftungen. Beispielsweise: **Blatt holen**, **Was tun?**, **Schwer. Aua.**, **Kampf-Laune** und **Oberboss!**. Auch Importfenster, Hinweise und eigene Fehlermeldungen verwenden diese Sprache. Die Stärkeabstufungen bleiben sichtbar. Charakter-, Talent-, Attributs- und Waffennamen aus der Datei sowie Würfelbefehle und Chatkarten des Probenmoduls behalten ihre ursprüngliche Form. Beim Wechsel zu einer anderen Darstellung kehren die normalen Beschriftungen zurück.

## Talentstärken erkennen

Das Pergament wird mit höherem Gesamtwert des Talents schrittweise heller und feiner. Wert 0 oder darunter erscheint auf abgenutztem Pergament mit gestricheltem Wertfeld. Ab 10 hebt ein Goldrahmen mit Stern das Talent hervor. Die kleine Legende und der Hinweis am Wertfeld erklären die Abstufung: 0 ungeübt, 1–3 Grundlagen, 4–6 geübt, 7–9 versiert und 10+ meisterlich. Diese Bezeichnungen dienen der Orientierung in der Oberfläche; sie ändern keine Regeln oder Würfelwerte. Attribute verwenden eine eigene Skala: 1 sehr schwach, 10 durchschnittlich und ab 20 meisterlich. Widerstands- und Reaktionsproben bleiben ohne Stärke-Einstufung.

Kampftalente verwenden dieselbe Skala. Maßgeblich ist der Wert der besten verwendeten Waffentechnik, bevor Basis, Fokus, Waffenbonus und Behinderung einfließen. Dieser Talentwert steht unter dem Waffennamen; die Spalte **Wert** zeigt weiterhin den fertigen AT-/PA-/FK-Probenwert. Tierangriffe haben fertige AT-/PA-Werte und erhalten keine Talentstufe.

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

## Kampf und Tierproben

Unter **Kampf** stehen Angriff und Parade für Nahkampfwaffen, Schilde und Parierwaffen sowie Fernkampfangriffe. Die beste erlaubte Waffentechnik wird wie in Pedipalpus ausgewählt; bei Gleichstand bleibt die Reihenfolge der Waffe erhalten. Der Wert enthält Fertigkeit, Basis, Fokus, Waffenbonus und wirksame Behinderung. Nahkampf verwendet `max(0, BE − Waffentoleranz)`, Fernkampf `max(0, BE − 2)`. Der Hinweis über **AT / PA / FK** zeigt die Bestandteile. Situative Modifikatoren werden über **Nächste Probe** eingestellt.

Unter **Tierproben** stehen die gespeicherten Angriffe und Paraden der Tiere. Ihre AT-/PA-Werte sind bereits fertig berechnet; Charakterbasis, Fokus und Behinderung werden nicht noch einmal addiert. Schaden und Sonderfolgen werden nicht automatisch abgewickelt.

Für diese Bereiche nach dem Update die Charakterdatei erneut importieren. Fehlen Pflichtwerte, erscheint ein Hinweis; es werden keine Ersatzwerte erfunden. Die Dateiversion bleibt 17, auch wenn neuere Dateien Portraits und Tierangriffe enthalten.

Die Auswertung erfolgt über Ucurifunke – Proben 1.0.14. Dessen Kampfregeln unterscheiden sich in Randfällen vom neuen lokalen Pedipalpus-Würfelmodus: Die lokale Qualitätsdeckelung bei Netto-Erleichterung und die automatische Erfolgs-/Misserfolgsregel für natürliche 1/20 sind in Foundrys veröffentlichtem Modul noch nicht vollständig gleich umgesetzt. Für eine einheitliche Auswertung muss das Probenmodul entsprechend aktualisiert werden.

## Kampffokus

Im Kampfbereich den **Fokus** zwischen DEF (links) und OFF (rechts) einstellen, von −4 bis +4 wie in Pedipalpus. Angriff und Parade ändern sich sofort gegensinnig; Fernkampf, Tierproben und Talentstärken bleiben gleich. Der Fokus wird am Foundry-Charakter gespeichert und gilt bis zur nächsten Änderung. Besitzer dürfen ihn ändern, Beobachter können ihn sehen. Vorhandene Kampfimporte ab 0.7.0 sind direkt nutzbar. Ein neuer JSON-Import übernimmt wieder den Fokus aus der importierten Datei. Die lokale Windows-Datei wird nicht verändert.

## Charakter- und Tokenbilder

Beim JSON-Import optional ein Bild auswählen oder anschließend den **Bildknopf** neben **JSON importieren** nutzen. Pedipalpus speichert das Bild separat unter `CharacterPortraits`; die JSON enthält nur `PortraitFileName`. Dieser Ordner kann im Browser nicht automatisch geöffnet werden, deshalb muss die Bilddatei zusätzlich ausgewählt werden.

PNG, JPG/JPEG, BMP und WebP bis 10 MB werden unterstützt. BMP wird für Foundry in PNG umgewandelt. Das Bild wird als Charakterportrait, als Bild der Token-Vorlage und für bestehende verknüpfte Tokens übernommen, die der Benutzer bearbeiten darf. Unverknüpfte Tokens und Tokens anderer Charaktere behalten ihre Bilder. Ohne Bildauswahl bleiben sämtliche bestehenden Bilder erhalten. Die Übernahme benötigt Foundry-Uploadrechte; fehlende Tokenrechte werden gemeldet. Die Bilder werden im Datenordner der Welt gespeichert und gehören nicht zum Modul-Release.

## Werte aktualisieren

Werte in Pedipalpus ändern, speichern und die JSON-Datei erneut **in denselben Foundry-Charakter** importieren. Bilder, Besitzerrechte und Token-Verknüpfungen bleiben erhalten. Es gibt keine automatische Synchronisierung mit der Windows-App oder den Foundry-Ressourcenfeldern.

Vorhandene Importe aus früheren Modulversionen bleiben verwendbar; für die bisherigen Talent- und Attributsproben ist kein erneuter Import erforderlich. Neue Kampf- und Tierproben benötigen einen erneuten Import. Ein erneuter Import ersetzt auch Änderungen aus der früheren Bearbeitungsoberfläche. Die Speicherdateiversion 17 ist geprüft; andere Versionen erfordern einen Wertevergleich.

## Optionales Makro

```js
game.modules.get('pedipalpus-foundry').api.open();
```
