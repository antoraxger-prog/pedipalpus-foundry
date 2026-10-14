# Pedipalpus – Proben · 1.0.0

Pedipalpus-Charaktere importieren und ihre Proben direkt in Foundry würfeln.

## Pedipalpus als Grundlage

Dieses Modul ergänzt die Windows-App **Pedipalpus von [Tschuangtse](https://github.com/Tschuangtse)**. Zum Spielen wird eine dort erstellte und gespeicherte Charakterdatei benötigt. Charaktererstellung und Steigerungen erfolgen in Pedipalpus; dieses Modul bringt die importierten Proben nach Foundry.

- [Pedipalpus – unser Fork des Originalprojekts von Tschuangtse](https://github.com/antoraxger-prog/Pedipalpus)

Der Fork ist derzeit privat und nur für GitHub-Konten mit Zugriffsfreigabe erreichbar. Dieses Foundry-Modul enthält die Windows-App nicht; bereits importierte Charaktere bleiben auch ohne laufende Windows-App verwendbar.

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
5. Einen Bereich auswählen oder über die Suche eine Probe finden. Das Würfelsymbol würfelt direkt; **durchgestrichenes Auge + Würfelsymbol** würfelt verdeckt. Das Ergebnis erscheint ohne weitere Modifikator-Abfrage im Chat.

Zum Import und Würfeln werden Besitzerrechte benötigt. Neue Charaktere benötigen zusätzlich die entsprechende Foundry-Berechtigung. Beobachter können die Proben lesen.

## Kompakte Oberfläche

Das Fenster startet mit 540 × 520 Pixeln und kann vergrößert werden. Die Probenliste scrollt im Fenster. Angezeigt werden nur vollständig definierte Attributs-, Widerstands-, Reaktions-, Fertigkeits-, Freizeit-, Zauber-, Ritual- und Wunderproben. Bereiche ohne Proben werden ausgeblendet. Die Suche durchsucht alle Bereiche. Fantasy mit Holzrahmen und Pergament ist der Standard für neue Benutzer. Dunkel, Hell, Ork, Dämonisch, Aristocrat, Krieger, Magie und Alchemy bleiben auswählbar. Die zuletzt gewählte Darstellung wird pro Foundry-Benutzer in der Welt gespeichert und beim nächsten Öffnen sowie auf anderen Geräten wieder verwendet. Beim ersten Öffnen nach dem Update wird die bisherige Browserauswahl einmalig für diesen Benutzer übernommen; andere Benutzer erhalten Fantasy, bis sie selbst eine Darstellung auswählen.

Biografie, vollständiges Inventar, Charakter-Energien, AP-Anzeigen, Zustände und allgemeine Charakterbearbeitung sind nicht Bestandteil des Würfelfensters. Kampf- und Tierproben sind ausschließlich im **Kampfbrett** über das gekreuzte Waffensymbol erreichbar. Sie erscheinen weder in der normalen Probenliste noch im Probenring. Der Fokusregler gehört ebenfalls zum Kampfbrett.

## Spielansicht und Werkzeuge

Der Kopf zeigt Portrait und Charakter; Auswahl und Knöpfe stehen auf einer Höhe. Import, Bildwechsel, Darstellung, Einstellungen, Austauschpaket und Versionsinformationen liegen unter **Werkzeuge**. Die Probenliste erhält dadurch mehr Platz. Zusätzliche Sprecherzeile, Modifikatorüberschrift und die untere Hinweisleiste entfallen. Würfe erzeugen keinen zusätzlichen Bestätigungstext im Fenster; Fehler bleiben gemeldet. Die letzte Figur, der Bereich sowie Fenstergröße und Position werden wiederhergestellt. Fenstergröße und Position sind pro Benutzer im jeweiligen Browser gespeichert und werden auf den sichtbaren Bildschirm begrenzt.

Unter **Einstellungen** stehen Normal, Kompakt und Große Knöpfe, die Sprache, Animationen und Klänge zur Wahl. Sprache lässt sich unabhängig vom Design auf Normal oder Ork stellen. **Ausgewähltem Token folgen** ist optional; ohne diese Option bleibt der ausgewählte Charakter fest. Bei mehreren ausgewählten Tokens findet kein automatischer Wechsel statt. Beim Charakterwechsel werden Erschwernis und Erleichterung zurückgesetzt.

## Favoriten und schneller Zugriff

Der Stern an einer Probe speichert sie persönlich für den jeweiligen Charakter. **Meine Favoriten** stehen im Bereichsfilter. Bis zu sechs normale Favoriten erscheinen in der einklappbaren Schnellleiste als höchstens 150 Pixel breite Karten. Mit dem Stern direkt in der Karte lässt sich ein Favorit entfernen. Kampffavoriten sind im Kampfbrett über den Bereichsfilter erreichbar; gespeicherte Einträge bleiben erhalten. Unter **Einstellungen → Favoriten ordnen** lassen sich Reihenfolge und Einträge ändern. Favoriten und Makros werden über Typ, Herkunft und Namen dem aktuellen Import zugeordnet; geänderte Arrayreihenfolgen verwenden keine fremden Proben. Bei entfernten oder mehrfach gleich benannten Proben wird nicht automatisch geraten.

Waffen stehen in einem gemeinsamen Block mit Talentwert und getrennten AT-/PA-Aktionen. Ein Klick auf die Wertplakette zeigt die vorhandene Berechnung. Der Kopf enthält Knöpfe für das **Kampfbrett**, den **Probenring** mit sechs Favoriten und die Rückkehr zur vollständigen Ansicht. Kampfbrett und normale Probenansicht teilen Charakter, nächsten Modifikator sowie dieselbe Fenstergröße und Position. Der Schwert-und-Schild-Knopf wechselt die Ansicht innerhalb des vorhandenen Fensters. Der gespeicherte Fokus gilt für Kampfproben und wird nur im Kampfbrett angezeigt.

Eine Probe am Namen auf Foundrys Makroleiste ziehen. Dafür werden Besitzerrechte und das Recht zum Erstellen von Makros benötigt. Das Makro liest die aktuellen Werte; ein Kampfmakro wechselt bei geöffnetem Fenster ins Kampfbrett, ein normales Makro von dort zurück zur Probenansicht; bei geöffnetem Würfelfenster verwendet es dessen nächsten Modifikator, sonst 0. Die öffentliche API ist `game.modules.get('pedipalpus-foundry').api.roll({actorId, reference, blind, modifier})`. Es werden keine Zahlen in Makros eingefroren.

Foundrys Tastaturkonfiguration enthält frei belegbare Aktionen für Öffnen/Suche, Kampfbrett und Probenring. Es werden keine bestehenden Tasten vorbelegt. In Textfeldern werden diese Aktionen nicht ausgelöst. In der Suche setzt Pfeil nach unten den Fokus auf den ersten erreichbaren Würfelknopf; Escape leert die Suche.

## Rückmeldungen und Soundeffekte

**Einstellungen → Soundeffekte** schaltet die persönlichen Klänge ein oder vollständig aus. Standardmäßig sind sie eingeschaltet, mit 25 % UI-Lautstärke und zusätzlich gedämpfter Wiedergabe. Die bisherige Voreinstellung wird beim Update einmal auf diesen leisen Standard umgestellt. Danach bleibt eine persönliche Deaktivierung gespeichert. Lautstärke 0 bleibt still. Die Vorschau **Rastklang anhören** spielt den kurzen metallischen Klick; bei 0 oder blockierter Wiedergabe gibt sie einen Hinweis. Alle Sounds entstehen lokal, ohne externe Dienste oder Übertragung an andere Spieler.

Das Mausrad funktioniert über der Zahl und über **Erschwernis/Erleichterung**. Änderungen spielen bei aktiviertem Sound zufällig einen von drei kurzen Ausschnitten aus der gewählten Gear-Click-Aufnahme. Auch beim Bewegen des Fokusreglers erklingt ein Klick. Die Ausschnitte werden einmal lokal geladen und wiederverwendet; für die Wiedergabe werden keine externen Dienste kontaktiert. Quelle und Lizenz stehen in [Audio-Credits](AUDIO-CREDITS.md). Nur die Klangfolge wird bei schnellem Drehen begrenzt; jeder Mausradschritt ändert weiter den Wert. Weitere kurze Klänge bestätigen Import und Favoriten. Es gibt keine Ergebnisfanfaren oder gesprochenen Kommentare.

Animationen lassen sich auf Aus, Dezent oder Lebendig stellen. Gedrückte Knöpfe, gespeicherte Änderungen, Fokuswirkung und verbrauchter Modifikator erhalten kurze Rückmeldungen. Zahlen ändern sich sofort; Knöpfe wandern nicht. Reduzierte Bewegung wird berücksichtigt. „Probe ausgelöst“ bezeichnet die ausgeführte Aktion, nicht einen regeltechnischen Erfolg.

## Wertmarkierungen und Kategorien

Lorbeerkränze erscheinen nur bei Fertigkeiten ab 10, Kampffertigkeiten ab Talentwert 20 und Attributen ab 20. Niedrigere Werte tragen keinen Kranz. Eine Wertplakette mit 0 zeigt Risse; Zahl und Würfelknöpfe bleiben lesbar und bedienbar.

Körperliche Fertigkeiten sind am Symbol und linken Zeilenrand rot, soziale lila, Natur grün, akademische blau und handwerkliche braun markiert. Das Attributsymbol bleibt unverändert. In Orksprache tragen auch würfelbare Eigenschaften einfache Namen mit dem Original klein darunter. Designnamen Dämonisch, Aristocrat, Krieger, Magie und Alchemy bleiben unverändert.

## Glanz, Holz und besondere Designs

Beim Überfahren einer Fähigkeit läuft ein kurzer, dezenter Glanz über die gesamte Zeile. Klickflächen und Schrift bleiben an derselben Position. Auch die Karten im Probenring reagieren auf das Überfahren. Der Glanz gehört zu **Animationen** und bleibt bei **Aus** oder reduzierter Bewegung statisch.

Die Holztextur in Fantasy und Ork wird groß und durchgehend über den Fensterhintergrund gelegt, einschließlich der Titelleiste; kleine wiederholte Kacheln entfallen.

Unter **Werkzeuge → Darstellung → Dämonisch** stehen schwarzer Marmor, dunkle Felder, warme Feuerkanten und ein glühender Bannkreis mit Pentagramm zur Wahl. Der Feuerkreis bewegt sich langsam, sein Licht flackert sanft. **Dezent** und **Lebendig** unterscheiden die Bewegung; **Aus** hält den Hintergrund an. Reduzierte Bewegung wird berücksichtigt. Das Design ist persönlich gespeichert; Daten und Probenregeln ändern sich nicht.

**Aristocrat** kombiniert hellen Marmor mit großzügigen Gold-/Silberrahmen, einer Krone, facettierten Rubinen, Saphiren und Smaragden. Edelsteine funkeln und Metallverzierungen schimmern. Die vorhandenen Einstellungen Dezent, Lebendig und Aus sowie reduzierte Bewegung gelten auch hier.

## Importvergleich und Austauschpakete

Vor einem erneuten Import mit tatsächlichen Unterschieden zeigt ein Vergleich Änderungen, hinzugefügte/entfernte Proben und den Fokus. **Aktuellen Foundry-Fokus behalten** ist optional. Abbrechen übernimmt keine Daten.

Ein Charakter-ZIP enthält genau eine gültige Pedipalpus-JSON und optional ein PNG/JPG/BMP/WebP-Bild; Ordner sind erlaubt. ZIP bis 17 MB, JSON bis 5 MB, Bild bis 10 MB. Programm-ZIPs oder Archive mit mehreren Charakteren werden abgelehnt. Ein zusätzlich gewähltes manuelles Bild hat Vorrang vor dem Paketbild.

**Austauschpaket** exportiert die beim Import mitgeführte JSON mit aktuellen Rüstungszuständen und ein erreichbares Portrait aus der Foundry-Welt. Alte Importe benötigen dafür einmalig einen erneuten Originalimport. Rüstungsänderungen werden in der exportierten JSON berücksichtigt. Beim Export werden die drei Fokuswerte auf den aktuellen Foundry-Stand gesetzt und der Portraitdateiname passend zur beiliegenden Bilddatei gespeichert; alle anderen Originalfelder bleiben erhalten. Die ursprüngliche Windows-Datei wird nicht verändert. Das Paket kann in einer anderen Foundry-Welt importiert werden. Windows-Daten werden weiterhin bewusst über Dateien und den Ordner CharacterPortraits übernommen, nicht automatisch synchronisiert.

Eine gemeinsame Ergebnis-/Proben-Schnittstelle mit Ucurifunke und ein eigener Paketexport in der Windows-App benötigen weiterhin Abstimmung mit deren Entwickler. Das Modul verändert keine fremde Regelauswertung. Ergebnissiegel und Erfolgs-/Patzerklänge bleiben bis zu einer verlässlichen Ergebnisanbindung aus.

## Ork-Darstellung

Unter **Darstellung → Ork** wird das Fenster zu einer groben Holz- und Lederoberfläche mit Knochen, Stoßzähnen und einfachen Beschriftungen. Beispielsweise: **Blatt holen**, **Was tun?**, **Schwer. Aua.**, **Kampf-Laune** und **Oberboss!**. Auch Importfenster und eigene Fehlermeldungen verwenden diese Sprache. Die Sprache verwendet kurze, einfache Sätze. Die Stärkeabstufungen bleiben sichtbar. Talente erhalten einfache Anzeigenamen, etwa **Welt wissen** für Geographie oder **Aua weg machen** für Heilkunde. Der ursprüngliche Talentname steht klein darunter, auch in Favoriten und im Probenring. Unbekannte eigene Talente heißen **Extra Ding können** mit ihrem Originalnamen darunter. Waffen- und Charakternamen sowie die gespeicherten Daten, Würfelbefehle und Chatkarten bleiben in ihrer ursprünglichen Form. Suche akzeptiert beide Namen. Beim Wechsel zur normalen Sprache kehren die ursprünglichen Beschriftungen zurück.

## Talentstärken erkennen

Das Pergament wird mit höherem Gesamtwert des Talents schrittweise heller und feiner. Wert 0 erscheint mit einem gerissenen Wertfeld. Unter 10 erscheint kein Lorbeerkranz. Ab 10 hebt der goldene Lorbeerkranz mit Stern das Talent hervor. Der Hinweis am Wertfeld erklärt die Abstufung: 0 ungeübt, 1–3 Grundlagen, 4–6 geübt, 7–9 versiert und 10+ meisterlich. Diese Bezeichnungen dienen der Orientierung in der Oberfläche; sie ändern keine Regeln oder Würfelwerte. Attribute verwenden eine eigene Skala: 1 sehr schwach, 10 durchschnittlich und ab 20 meisterlich. Widerstands- und Reaktionsproben bleiben ohne Stärke-Einstufung.

Kampftalente tragen den Meisterkranz ab Talentwert 20. Maßgeblich ist der Wert der besten verwendeten Waffentechnik, bevor Basis, Fokus, Waffenbonus und Behinderung einfließen. Dieser Talentwert steht unter dem Waffennamen; die Spalte **Wert** zeigt weiterhin den fertigen AT-/PA-/FK-Probenwert. Tierangriffe haben fertige AT-/PA-Werte und erhalten keine Talentstufe.

Auch in Dunkel und Hell bleiben ungeübte und meisterliche Talente durch Wertmarkierungen erkennbar. Die Oberflächen verwenden mitgelieferte Grafiken und lokale Schriften, ohne externe Bild- oder Schriftquellen.

## Erschwernis, Erleichterung und verdeckte Proben

**Nächste Probe** gilt für genau einen Wurf und wird danach auf 0 zurückgesetzt. Das Feld zeigt den Betrag ohne Vorzeichen: rot bei Erschwernis, grün bei Erleichterung, neutral bei 0. Die Bezeichnung daneben lässt sich anklicken, um zwischen beiden Richtungen zu wechseln.

Die Hinweise **↑ schwerer** und **↓ leichter** lassen sich anklicken und ändern den Modifikator um +1 beziehungsweise −1. Auch über diesen Hinweisen funktioniert das Mausrad. Mit dem Mausrad über der Zahl oder der Richtungsbezeichnung: **↑ schwerer · ↓ leichter**. Beim Scrollen durch 0 wechselt die Richtung automatisch. Der Wert lässt sich auch eintippen. Die Probenliste scrollt weiterhin, wenn sich der Zeiger außerhalb des Felds befindet.

Der zweite Knopf **durchgestrichenes Auge + Würfelsymbol** erzwingt einen verdeckten Wurf: Nur Spielleiter sehen das Ergebnis. Normale Würfe beachten den in Foundry eingestellten Chatmodus.

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

Pedipalpus speichert das Bild separat unter `CharacterPortraits`; die JSON enthält nur `PortraitFileName`. Beim Import **Pedipalpus-Ordner auswählen** und den Ordner mit `SavedCharacters` und `CharacterPortraits` freigeben. Nach der Charakterauswahl findet das Modul das zugehörige Bild automatisch. Alternativ JSON und Bild gemeinsam auswählen, ein Charakter-ZIP importieren oder ein manuelles Bild hinzufügen. Das Modul liest ausschließlich ausgewählte bzw. ausdrücklich freigegebene Dateien.

PNG, JPG/JPEG, BMP und WebP bis 10 MB werden unterstützt. BMP wird für Foundry in PNG umgewandelt. Das vollständige Bild bleibt als Charakterportrait erhalten. Für die Token-Vorlage entsteht ein separates rundes PNG mit transparentem Außenbereich und dem ausgewählten Rahmen. Bearbeitbare verknüpfte Tokens erhalten dieses Tokenbild. Unverknüpfte Tokens und Tokens anderer Charaktere behalten ihre Bilder. Ohne Bildauswahl bleiben sämtliche bestehenden Bilder erhalten. Die Übernahme benötigt Foundry-Uploadrechte; fehlende Tokenrechte werden gemeldet. Die Bilder werden im Datenordner der Welt gespeichert und gehören nicht zum Modul-Release.

## Werte aktualisieren

Werte in Pedipalpus ändern, speichern und die JSON-Datei erneut **in denselben Foundry-Charakter** importieren. Bilder, Besitzerrechte und Token-Verknüpfungen bleiben erhalten. Es gibt keine automatische Synchronisierung mit der Windows-App oder den Foundry-Ressourcenfeldern.

Vorhandene Importe aus früheren Modulversionen bleiben verwendbar; für die bisherigen Talent- und Attributsproben ist kein erneuter Import erforderlich. Neue Kampf- und Tierproben benötigen einen erneuten Import. Ein erneuter Import ersetzt auch Änderungen aus der früheren Bearbeitungsoberfläche. Die Speicherdateiversion 17 ist geprüft; andere Versionen erfordern einen Wertevergleich.

## Optionales Makro

```js
game.modules.get('pedipalpus-foundry').api.open();
```

## Krieger, Magie und Alchemy

**Krieger** zeigt schwere Metallplatten mit Nieten, Lederriemen, Schwertklingen und Schild. **Magie** verwendet dunkles Violett/Blau, rotierende Runenkreise, arkanes Licht und funkelnde Partikel. **Alchemy** basiert auf schwarzem Leder mit wenigen giftgrünen Akzenten und einer animierten Flasche mit aufsteigenden Säurebläschen. Die Messer wurden entfernt. Alle Designs werden persönlich gespeichert und beachten Animationen Aus sowie reduzierte Bewegung.

## Aktualisieren von der letzten Quelle

**Aktualisieren** neben **JSON importieren** liest die zuletzt freigegebene Datei erneut und zeigt vor der Übernahme den Importvergleich. Dafür beim Import **Datei auswählen** oder **Pedipalpus-Ordner auswählen** verwenden. Unterstützte Browser speichern die Dateifreigabe pro Foundry-Benutzer, Welt und Charakter im jeweiligen Browser; Zugriffe bleiben lesend. Nach einem Browserneustart kann die Freigabe erneut abgefragt werden. Bei fehlendem Zugriff, einer verschobenen Datei oder Browsern ohne dauerhaften Dateizugriff öffnet sich die Importauswahl erneut. Es wird kein alter Dateistand als Aktualisierung ausgegeben.

## Rüstungen und Tierbegleiter im Kampfbrett

Im Bereichsfilter des Kampfbretts stehen **Rüstungen** und **Tierproben**. Rüstungen zeigen RS, Basis-BE sowie die aus Pedipalpus übernommenen Zustände **Dabei** und **Angelegt**. Besitzer können beide Häkchen ändern. Ablegen entfernt auch Angelegt; eine bei einem Tier gelagerte Rüstung kann nicht am Charakter angelegt werden. Rüstschutz, Last/Überlastung und Behinderung folgen den gespeicherten Pedipalpus-Feldern; Kampfwürfe verwenden die aktualisierte BE. Bei fehlender Basis-BE ist zuerst ein neuer Pedipalpus-Speicherstand nötig. Änderungen werden in Foundry und im Austauschpaket gespeichert; die Windows-Datei bleibt unberührt. Checkboxen passen sich dem gewählten Design an.

Die Tierübersicht zeigt auch Begleiter ohne Angriffe. **Bild / Token** lädt ein Tierportrait hoch und erstellt einen eigenen, verknüpften Foundry-Charakter mit dessen Tierproben und dem ausgewählten Rahmen. Den Eintrag aus dem Charakterverzeichnis auf die Szene ziehen. Ein späterer Bild-/Rahmenwechsel aktualisiert denselben Eintrag. Stabile Pedipalpus-Tierkennungen bzw. eindeutige Namen verhindern eine falsche Zuordnung; ein erneuter Eltern-Import aktualisiert die Tierproben und behält Portrait/Tokenbild. Entfernte oder mehrdeutige Begleiter behalten ihren Eintrag, haben aber keine veralteten Proben. Erstellung benötigt die Foundry-Berechtigung zum Anlegen von Charakteren.

## Private Originalrahmen

Die Originalrahmen werden separat importiert und sind nicht im öffentlichen Modul oder auf GitHub enthalten. Ein Spielleiter lädt das private Rahmen-ZIP einmal über **Werkzeuge → Einstellungen → Originalrahmen importieren** in die Welt. Das Paket enthält `concrete.png`, `concrete-mask.png`, `silver-thin.png`, `silver-thin-mask.png`, `undead.png` und `undead-mask.png`. Danach nutzen alle Benutzer die Rahmen aus den Weltdaten. **Concrete** ist Standard; **Silver, Thin** und **Undead** stehen unter Tokenrahmen zur Wahl. Ohne importiertes Rahmenpaket wird zunächst ein rundes Token ohne Originalring erstellt. **Token aktualisieren** erstellt aus dem vorhandenen Charakterportrait ein neues Tokenbild mit dem gewählten Rahmen. Für Tierportraits steht dieselbe Auswahl direkt am Tier zur Verfügung.
