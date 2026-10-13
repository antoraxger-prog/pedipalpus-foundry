# Pedipalpus – Proben · 0.11.0

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
3. **Werkzeuge** (Zahnrad) öffnen und **JSON importieren** wählen. Eine JSON-Datei oder ein Charakter-ZIP auswählen.
4. Unter **In Foundry speichern als** einen bestehenden Charakter auswählen oder einen neuen anlegen.
5. Einen Bereich auswählen oder über die Suche eine Probe finden. Das Würfelsymbol würfelt direkt; **? + Würfelsymbol** würfelt verdeckt. Das Ergebnis erscheint ohne weitere Modifikator-Abfrage im Chat.

Zum Import und Würfeln werden Besitzerrechte benötigt. Neue Charaktere benötigen zusätzlich die entsprechende Foundry-Berechtigung. Beobachter können die Proben lesen.

## Kompakte Oberfläche

Das Fenster startet mit 540 × 520 Pixeln und kann vergrößert werden. Die Probenliste scrollt im Fenster. Angezeigt werden nur vollständig definierte Attributs-, Widerstands-, Reaktions-, Fertigkeits-, Freizeit-, Zauber-, Ritual- und Wunderproben. Bereiche ohne Proben werden ausgeblendet. Die Suche durchsucht alle Bereiche. Fantasy mit Holzrahmen und Pergament ist der Standard für neue Benutzer. Dunkel, Hell und Ork bleiben auswählbar. Die zuletzt gewählte Darstellung wird pro Foundry-Benutzer in der Welt gespeichert und beim nächsten Öffnen sowie auf anderen Geräten wieder verwendet. Beim ersten Öffnen nach dem Update wird die bisherige Browserauswahl einmalig für diesen Benutzer übernommen; andere Benutzer erhalten Fantasy, bis sie selbst eine Darstellung auswählen.

Biografie, Inventar, Energien, AP-Anzeigen, Zustände und Bearbeitungsfelder sind nicht Bestandteil des Würfelfensters. Kampf- und Tierproben sind ausschließlich im **Kampfbrett** über das gekreuzte Waffensymbol erreichbar. Sie erscheinen weder in der normalen Probenliste noch im Probenring. Der Fokusregler gehört ebenfalls zum Kampfbrett.

## Spielansicht und Werkzeuge

Der Kopf zeigt Portrait und Charakter; Auswahl und Knöpfe stehen auf einer Höhe. Import, Bildwechsel, Darstellung, Einstellungen, Vorlagen, Austauschpaket und Versionsinformationen liegen unter **Werkzeuge**. Die Probenliste erhält dadurch mehr Platz. Zusätzliche Sprecherzeile, Modifikatorüberschrift und die untere Hinweisleiste entfallen. Würfe erzeugen keinen zusätzlichen Bestätigungstext im Fenster; Fehler bleiben gemeldet. Die letzte Figur, der Bereich sowie Fenstergröße und Position werden wiederhergestellt. Fenstergröße und Position sind pro Benutzer im jeweiligen Browser gespeichert und werden auf den sichtbaren Bildschirm begrenzt.

Unter **Einstellungen** stehen Normal, Kompakt und Große Knöpfe, die Sprache, Animationen und Klänge zur Wahl. Sprache lässt sich unabhängig vom Design auf Normal oder Ork stellen. **Ausgewähltem Token folgen** ist optional; ohne diese Option bleibt der ausgewählte Charakter fest. Bei mehreren ausgewählten Tokens findet kein automatischer Wechsel statt. Beim Charakterwechsel werden Erschwernis und Erleichterung zurückgesetzt.

## Favoriten und schneller Zugriff

Der Stern an einer Probe speichert sie persönlich für den jeweiligen Charakter. **Meine Favoriten** und **Zuletzt verwendet** stehen im Bereichsfilter. Bis zu sechs normale Favoriten erscheinen in der einklappbaren Schnellleiste. Kampffavoriten und zuletzt verwendete Kampfproben sind im Kampfbrett über den Bereichsfilter erreichbar; gespeicherte Einträge bleiben erhalten. Unter **Einstellungen → Favoriten ordnen** lassen sich Reihenfolge und Einträge ändern. Favoriten und Makros werden über Typ, Herkunft und Namen dem aktuellen Import zugeordnet; geänderte Arrayreihenfolgen verwenden keine fremden Proben. Bei entfernten oder mehrfach gleich benannten Proben wird nicht automatisch geraten.

Waffen stehen in einem gemeinsamen Block mit Talentwert und getrennten AT-/PA-Aktionen. Ein Klick auf die Wertplakette zeigt die vorhandene Berechnung. Der Kopf enthält Knöpfe für ein kleineres **Kampfbrett**, den **Probenring** mit sechs Favoriten und die Rückkehr zur vollständigen Ansicht. Kampfbrett und normale Probenansicht teilen Charakter und nächsten Modifikator. Der gespeicherte Fokus gilt für Kampfproben und wird nur im Kampfbrett angezeigt.

Eine Probe am Namen auf Foundrys Makroleiste ziehen. Dafür werden Besitzerrechte und das Recht zum Erstellen von Makros benötigt. Das Makro liest die aktuellen Werte; ein Kampfmakro wechselt bei geöffnetem Fenster ins Kampfbrett, ein normales Makro von dort zurück zur Probenansicht; bei geöffnetem Würfelfenster verwendet es dessen nächsten Modifikator, sonst 0. Die öffentliche API ist `game.modules.get('pedipalpus-foundry').api.roll({actorId, reference, blind, modifier})`. Es werden keine Zahlen in Makros eingefroren.

Foundrys Tastaturkonfiguration enthält frei belegbare Aktionen für Öffnen/Suche, Kampfbrett und Probenring. Es werden keine bestehenden Tasten vorbelegt. In Textfeldern werden diese Aktionen nicht ausgelöst. In der Suche setzt Pfeil nach unten den Fokus auf den ersten erreichbaren Würfelknopf; Escape leert die Suche.

## Rückmeldungen und Soundeffekte

**Einstellungen → Soundeffekte** schaltet die persönlichen Klänge ein oder vollständig aus. Standardmäßig sind sie eingeschaltet, mit 25 % UI-Lautstärke und zusätzlich gedämpfter Wiedergabe. Die bisherige Voreinstellung wird beim Update einmal auf diesen leisen Standard umgestellt. Danach bleibt eine persönliche Deaktivierung gespeichert. Lautstärke 0 bleibt still. Die Vorschau **Rastklang anhören** spielt den kurzen metallischen Klick; bei 0 oder blockierter Wiedergabe gibt sie einen Hinweis. Alle Sounds entstehen lokal, ohne externe Dienste oder Übertragung an andere Spieler.

Das Mausrad funktioniert über der Zahl und über **Erschwernis/Erleichterung**. Änderungen geben bei aktiviertem Sound einen kurzen metallischen Rastklang wie ein Safe-Drehknopf. Nur die Klangfolge wird bei schnellem Drehen begrenzt; jeder Mausradschritt ändert weiter den Wert. Weitere kurze Klänge bestätigen Fokus, Import und Favoriten. Es gibt keine Ergebnisfanfaren oder gesprochenen Kommentare.

Animationen lassen sich auf Aus, Dezent oder Lebendig stellen. Gedrückte Knöpfe, gespeicherte Änderungen, Fokuswirkung und verbrauchter Modifikator erhalten kurze Rückmeldungen. Zahlen ändern sich sofort; Knöpfe wandern nicht. Reduzierte Bewegung wird berücksichtigt. „Probe ausgelöst“ bezeichnet die ausgeführte Aktion, nicht einen regeltechnischen Erfolg.

## Importvergleich und Austauschpakete

Vor einem erneuten Import mit tatsächlichen Unterschieden zeigt ein Vergleich Änderungen, hinzugefügte/entfernte Proben und den Fokus. **Aktuellen Foundry-Fokus behalten** ist optional. Abbrechen übernimmt keine Daten.

Ein Charakter-ZIP enthält genau eine gültige Pedipalpus-JSON und optional ein PNG/JPG/BMP/WebP-Bild; Ordner sind erlaubt. ZIP bis 17 MB, JSON bis 5 MB, Bild bis 10 MB. Programm-ZIPs oder Archive mit mehreren Charakteren werden abgelehnt. Ein zusätzlich gewähltes manuelles Bild hat Vorrang vor dem Paketbild.

**Austauschpaket** exportiert die beim Import mitgeführte Original-JSON und ein erreichbares Portrait aus der Foundry-Welt. Alte Importe benötigen dafür einmalig einen erneuten Originalimport. Beim Export werden die drei Fokuswerte auf den aktuellen Foundry-Stand gesetzt und der Portraitdateiname passend zur beiliegenden Bilddatei gespeichert; alle anderen Originalfelder bleiben erhalten. Die ursprüngliche Windows-Datei wird nicht verändert. Das Paket kann in einer anderen Foundry-Welt importiert werden. Windows-Daten werden weiterhin bewusst über Dateien und den Ordner CharacterPortraits übernommen, nicht automatisch synchronisiert.

Eine gemeinsame Ergebnis-/Proben-Schnittstelle mit Ucurifunke und ein eigener Paketexport in der Windows-App benötigen weiterhin Abstimmung mit deren Entwickler. Das Modul verändert keine fremde Regelauswertung. Ergebnissiegel und Erfolgs-/Patzerklänge bleiben bis zu einer verlässlichen Ergebnisanbindung aus.

## Ork-Darstellung

Unter **Darstellung → Ork** wird das Fenster zu einer groben Holz- und Lederoberfläche mit Knochen, Stoßzähnen und einfachen Beschriftungen. Beispielsweise: **Blatt holen**, **Was tun?**, **Schwer. Aua.**, **Kampf-Laune** und **Oberboss!**. Auch Importfenster und eigene Fehlermeldungen verwenden diese Sprache. Die Sprache verwendet kurze, einfache Sätze. Die Stärkeabstufungen bleiben sichtbar. Talente erhalten einfache Anzeigenamen, etwa **Welt wissen** für Geographie oder **Aua weg machen** für Heilkunde. Der ursprüngliche Talentname steht klein darunter, auch in Favoriten und im Probenring. Unbekannte eigene Talente heißen **Extra Ding können** mit ihrem Originalnamen darunter. Waffen- und Charakternamen sowie die gespeicherten Daten, Würfelbefehle und Chatkarten bleiben in ihrer ursprünglichen Form. Suche akzeptiert beide Namen. Beim Wechsel zur normalen Sprache kehren die ursprünglichen Beschriftungen zurück.

## Talentstärken erkennen

Das Pergament wird mit höherem Gesamtwert des Talents schrittweise heller und feiner. Wert 0 oder darunter erscheint auf abgenutztem Pergament mit gestricheltem Wertfeld. Ab 10 hebt ein Goldrahmen mit Stern das Talent hervor. Der Hinweis am Wertfeld erklärt die Abstufung: 0 ungeübt, 1–3 Grundlagen, 4–6 geübt, 7–9 versiert und 10+ meisterlich. Diese Bezeichnungen dienen der Orientierung in der Oberfläche; sie ändern keine Regeln oder Würfelwerte. Attribute verwenden eine eigene Skala: 1 sehr schwach, 10 durchschnittlich und ab 20 meisterlich. Widerstands- und Reaktionsproben bleiben ohne Stärke-Einstufung.

Kampftalente verwenden dieselbe Skala. Maßgeblich ist der Wert der besten verwendeten Waffentechnik, bevor Basis, Fokus, Waffenbonus und Behinderung einfließen. Dieser Talentwert steht unter dem Waffennamen; die Spalte **Wert** zeigt weiterhin den fertigen AT-/PA-/FK-Probenwert. Tierangriffe haben fertige AT-/PA-Werte und erhalten keine Talentstufe.

Auch in Dunkel und Hell bleiben ungeübte und meisterliche Talente durch Wertmarkierungen erkennbar. Die Oberflächen verwenden mitgelieferte Grafiken und lokale Schriften, ohne externe Bild- oder Schriftquellen.

## Erschwernis, Erleichterung und verdeckte Proben

**Nächste Probe** gilt für genau einen Wurf und wird danach auf 0 zurückgesetzt. Das Feld zeigt den Betrag ohne Vorzeichen: rot bei Erschwernis, grün bei Erleichterung, neutral bei 0. Die Bezeichnung daneben lässt sich anklicken, um zwischen beiden Richtungen zu wechseln.

Mit dem Mausrad über der Zahl oder der Richtungsbezeichnung: **↑ schwerer · ↓ leichter**. Beim Scrollen durch 0 wechselt die Richtung automatisch. Der Wert lässt sich auch eintippen. Die Probenliste scrollt weiterhin, wenn sich der Zeiger außerhalb des Felds befindet.

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

Im Kampfbrett den **Fokus** zwischen DEF (links) und OFF (rechts) einstellen, von −4 bis +4 wie in Pedipalpus. Angriff und Parade ändern sich sofort gegensinnig; Fernkampf, Tierproben und Talentstärken bleiben gleich. Der Fokus wird am Foundry-Charakter gespeichert und gilt bis zur nächsten Änderung. Besitzer dürfen ihn ändern, Beobachter können ihn sehen. Vorhandene Kampfimporte ab 0.7.0 sind direkt nutzbar. Ein neuer JSON-Import übernimmt wieder den Fokus aus der importierten Datei. Die lokale Windows-Datei wird nicht verändert.

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
