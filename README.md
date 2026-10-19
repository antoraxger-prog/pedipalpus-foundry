# Pedipalpus – Proben · 1.5.1

Pedipalpus-Charaktere importieren und ihre Proben direkt in Foundry würfeln.

1.5.1 behebt die leere Bildvorschau im Foundry-Bildeditor. Vorhandene Profilbilder lassen sich wieder laden und im Tokenrahmen ausrichten.

## Pedipalpus als Grundlage

Dieses Modul ergänzt die Windows-App **Pedipalpus von [Tschuangtse](https://github.com/Tschuangtse)**. Zum Spielen wird eine dort erstellte und gespeicherte Charakterdatei oder eine NSC-Datei aus dem eigenständigen NSC-Generator im selben Originalprojekt benötigt. Charaktererstellung und Steigerungen erfolgen in Pedipalpus; dieses Modul bringt die importierten Proben nach Foundry.

- [Pedipalpus – unser Fork des Originalprojekts von Tschuangtse](https://github.com/antoraxger-prog/Pedipalpus)

Der Fork ist derzeit privat und nur für GitHub-Konten mit Zugriffsfreigabe erreichbar. Dieses Foundry-Modul enthält die Windows-App nicht; bereits importierte Charaktere bleiben auch ohne laufende Windows-App verwendbar.

## Voraussetzungen

- Foundry VTT 14
- Simple Worldbuilding
- Ucurifunke – Proben 1.0.14 für Kampf- und Gefolgsproben; ohne diese Proben bleiben 1.0.8–1.0.14 nutzbar

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
5. Einen Bereich auswählen oder über die Suche eine Probe finden. Ein Klick auf den Fähigkeitsnamen, den Probenwert oder das Würfelsymbol würfelt direkt; **durchgestrichenes Auge + Würfelsymbol** würfelt verdeckt. Das Ergebnis erscheint ohne weitere Modifikator-Abfrage im Chat.

Zum Import und Würfeln werden Besitzerrechte benötigt. Neue Charaktere benötigen zusätzlich die entsprechende Foundry-Berechtigung. Beobachter können die Proben lesen.

## Importoptionen und Begleiter

**Bilder übernehmen** und **Begleiter übernehmen** lassen sich unabhängig ausschalten. Ohne Bilder bleiben bestehendes Portrait und Tokenbilder erhalten; die optionale Bilddatei wird nicht gelesen. Ohne Begleiter bleiben vorhandene Begleiterdaten und deren Token-Einträge unverändert. Bei einem neuen Charakter werden dann keine Begleiter übernommen. **Aktualisieren** merkt sich diese beiden Entscheidungen zur gewählten Datei; es legt keine zusätzlichen Begleiter an und vergibt keine neuen Spielerrechte.

Bei eingeschaltetem Begleiterimport kann für jedes Wesen **Keinen Token ändern**, **Neuen Token-Eintrag anlegen** oder ein vorhandener eigener Begleiter bzw. leerer Foundry-Eintrag gewählt werden. Die erste Option übernimmt die Proben beim Hauptcharakter, lässt einen separaten Token-Eintrag aber unangetastet. Ein bereits eindeutig verknüpfter Begleiter ist als Aktualisierungsziel vorausgewählt. Hauptcharaktere, NSCs und Begleiter anderer Hauptcharaktere können hier nicht überschrieben werden. Ein Ziel darf nur einmal gewählt werden. Wer statt des alten Eintrags einen neuen wählt, behält den alten Actor samt Bild; seine automatische Verbindung zum Hauptcharakter endet. Neue Einträge ohne verfügbares Bild verwenden Foundrys Standardsymbol und können später über **Bild / Token** gestaltet werden. Neue Token-Einträge aus dem Charakterverzeichnis auf die Karte ziehen; es wird keine Szene automatisch befüllt.

Der Spielleiter kann über **Spieler zuweisen** zusätzliche Besitzerrechte am importierten Hauptcharakter und den ausgewählten Begleiter-Einträgen vergeben. Andere Rechte bleiben erhalten; nicht ausgewählte Begleiter erhalten keine neue Zuweisung.

Im Kampfbereich hat jedes Gefolgsmitglied einen eigenen aufklappbaren Abschnitt mit allen seinen Proben und **Bild / Token**. Die Abschnitte starten geschlossen; manuell geöffnete Abschnitte bleiben während der Sitzung für diesen Charakter gemerkt. Eine Suche öffnet passende Abschnitte vorübergehend. Die drei Spezialisierungen eines Haupttalents stehen unter einer gemeinsamen Überschrift mit Basiswert und Einfassung. Der Button zum Kampfbereich zeigt zwei gekreuzte Schwerter.

## NSC-Generator: eigener Import

Unter **JSON importieren** stehen **Charakter importieren** und **NSC importieren** getrennt zur Auswahl. Ein bereits ausgewählter Pedipalpus-Ordner bleibt erhalten. Im NSC-Bereich kann zusätzlich eine einzelne Datei oder ein eigener NSC-Ordner mit `SavedNpcs` gewählt werden; beide Ordnerauswahlen bleiben während der Sitzung unabhängig erhalten. Enthält ein gemeinsamer Ordner beide Speicherordner, zeigt jeder Bereich nur die passenden Dateien.

**JSON importieren** erkennt zusätzlich das NSC-Format `Pedipalpus.Npc`, Version 1, mit der Endung `.nsc.json`. Die Dateien liegen im Generator unter `SavedNpcs`. Datei oder Austausch-ZIP auswählen und einen neuen bzw. vorhandenen NSC als Ziel wählen. Die Auswahlliste kennzeichnet NSC mit **[NSC]**. Ein freigegebener Ordner kann `SavedCharacters` und `SavedNpcs` enthalten; **Aktualisieren** liest auch die letzte NSC-Datei frisch ein.

NSC verwenden ihre eigenen Berechnungen: Attributbasis plus Volksbeitrag und Modifikator, abgeleitete Werte einschließlich Rundung, Fähigkeits-/Merkmalsstufen 4/8/12/16/20 und Zauberwerte aus eigener Stufe oder höchstem passenden Merkmal. Zwischengespeicherte Summen werden nicht als fertige Werte vertraut. Kräfte ohne passendes Merkmal oder eigene Stufe und probenlose Rituale werden nicht gewürfelt; fehlende Werte werden nicht erfunden. Merkmale und allgemeine Fähigkeiten sind eigene Bereiche. Die NSC-Stufen heißen Amateur, Lehrling, Geselle, Meister und Legende; sie ersetzen keine Skala bisheriger Charaktere.

Vor allgemeinen Fähigkeits-, Merkmals-, Wahrnehmungs- und Kraftproben öffnet sich die Attributauswahl. Zwei gleiche Attribute sind erlaubt, drei gleiche wie im Generator gesperrt. Die Wahl für allgemeine Fähigkeiten und Merkmale bleibt in Foundry gemerkt und überlebt eindeutigen Reimport. Eine abweichende Auswahl für einen einzelnen Zauberwurf verändert dessen Originalattribute nicht. Abbrechen verbraucht die nächste Erschwernis nicht. Namen, Werte, Würfelknöpfe, verdeckte Würfe, Favoriten und Makros verwenden dieselbe Würfelfunktion.

NSC-Kampfwerte berücksichtigen eigene Techniken, Fokus, Rüstung und Waffenboni. Bei Gleichstand zählt die gespeicherte Reihenfolge der Kampftechniken. Fernkampf nutzt die im NSC gespeicherte Waffentoleranz; dies ändert die bisherige Charakterregel nicht. Waffengewicht erzeugt keine zusätzliche NSC-BE. Ausweichen ist ein fertiger PA-Wert und ändert sich nicht mit dem Fokus. NSC-Rüstungen besitzen ausschließlich **Angelegt**, keinen erfundenen Dabei-Zustand.

Das gesamte NSC-Gefolge wird übernommen: Tiere, Dämonen, Untote, Chimären, Personen, Elementare und Golems. Alle verwenden eigene Werte, Proben und **Bild / Token**. Die NSC-Datei enthält weder Portraits noch feste Gefolgskennungen. Bilder deshalb manuell oder im Austausch-ZIP hinzufügen. Für die Zuordnung beim Aktualisieren müssen Art und Name eines Gefolgsmitglieds eindeutig bleiben. Gleiche Art und gleicher Name werden nicht automatisch einem Token zugewiesen; bei Umbenennung bleibt der alte Eintrag mit Bild erhalten, erhält aber keine veralteten Proben. Für das umbenannte Wesen lässt sich ein neuer Token-Eintrag erstellen. Die aktuelle Hauptanwendung kann ebenfalls gespeicherte Chimären über dieselbe Gefolgsansicht verwenden; der Baukasten selbst bleibt in Pedipalpus.

Charakter- und NSC-Dateien dürfen einander nicht überschreiben. Unpassende vorhandene Importziele sind nach Dateiauswahl gesperrt. Ein verknüpfter Begleiter ist kein Ziel für einen Hauptimport. Ändert jemand den Foundry-Stand während des Importvergleichs, wird die Übernahme abgelehnt und muss neu verglichen werden. Gleichnamige Charakter- und NSC-Proben teilen keine Makroreferenz. Vorhandene Charaktere, Tiere und Skelette benötigen für dieses Update keinen Umbau.

Das Austauschpaket enthält bei NSC eine `npc.nsc.json` im ursprünglichen Format, mit aktuellen NSC-Rüstungszuständen und Fokus; die übrigen Originaldaten bleiben erhalten. Ein vorhandenes Portrait wird separat beigefügt, ohne fremde Portrait- oder Charakterfelder in die NSC-JSON einzutragen. Die Windows-Datei bleibt unberührt. Unterstützt ist Formatversion 1 bis 5 MB; fremde, gemischte und unbekannte zukünftige Formate werden zurückgewiesen. Es gibt keine automatische Generierung, Steigerung oder Ressourcenverwaltung im Foundry-Modul.

## Kompakte Oberfläche

Das Fenster startet mit 540 × 520 Pixeln und kann vergrößert werden. Die Probenliste scrollt im Fenster. Angezeigt werden nur vollständig definierte Attributs-, Widerstands-, Reaktions-, Fertigkeits-, Freizeit-, Zauber-, Ritual- und Wunderproben. Bereiche ohne Proben werden ausgeblendet. Die Suche durchsucht alle Bereiche. Fantasy mit Holzrahmen und Pergament ist der Standard für neue Benutzer. Dunkel, Hell, Ork, Dämonisch, Aristocrat, Krieger, Magie und Alchemy bleiben auswählbar. Die zuletzt gewählte Darstellung wird pro Foundry-Benutzer in der Welt gespeichert und beim nächsten Öffnen sowie auf anderen Geräten wieder verwendet. Beim ersten Öffnen nach dem Update wird die bisherige Browserauswahl einmalig für diesen Benutzer übernommen; andere Benutzer erhalten Fantasy, bis sie selbst eine Darstellung auswählen.

Biografie, vollständiges Inventar, Charakter-Energien, AP-Anzeigen, Zustände und allgemeine Charakterbearbeitung sind nicht Bestandteil des Würfelfensters. Kampf- und Gefolgsproben sind ausschließlich im **Kampfbrett** über das gekreuzte Waffensymbol erreichbar. Sie erscheinen weder in der normalen Probenliste noch im Probenring. Der Fokusregler gehört ebenfalls zum Kampfbrett.

## Spielansicht und Werkzeuge

Der Kopf zeigt Portrait und Charakter; Auswahl und Knöpfe stehen auf einer Höhe. Import, Bildwechsel, Darstellung, Einstellungen, Austauschpaket und Versionsinformationen liegen unter **Werkzeuge**. Die Probenliste erhält dadurch mehr Platz. Zusätzliche Sprecherzeile, Modifikatorüberschrift und die untere Hinweisleiste entfallen. Würfe erzeugen keinen zusätzlichen Bestätigungstext im Fenster; Fehler bleiben gemeldet. Die letzte Figur, der Bereich sowie Fenstergröße und Position werden wiederhergestellt. Fenstergröße und Position sind pro Benutzer im jeweiligen Browser gespeichert und werden auf den sichtbaren Bildschirm begrenzt.

Unter **Einstellungen** stehen Normal, Kompakt und Große Knöpfe, die Sprache, Animationen und Klänge zur Wahl. Sprache lässt sich unabhängig vom Design auf Normal oder Ork stellen. **Ausgewähltem Token folgen** ist optional; ohne diese Option bleibt der ausgewählte Charakter fest. Bei mehreren ausgewählten Tokens findet kein automatischer Wechsel statt. Beim Charakterwechsel werden Erschwernis und Erleichterung zurückgesetzt.

## Favoriten und schneller Zugriff

Der Stern an einer Probe speichert sie persönlich für den jeweiligen Charakter. **Meine Favoriten** stehen im Bereichsfilter. Bis zu sechs normale Favoriten erscheinen in der einklappbaren Schnellleiste als höchstens 150 Pixel breite Karten. Mit dem Stern direkt in der Karte lässt sich ein Favorit entfernen. Kampffavoriten sind im Kampfbrett über den Bereichsfilter erreichbar; gespeicherte Einträge bleiben erhalten. Unter **Einstellungen → Favoriten ordnen** lassen sich Reihenfolge und Einträge ändern. Favoriten und Makros werden über Typ, Herkunft und Namen dem aktuellen Import zugeordnet; geänderte Arrayreihenfolgen verwenden keine fremden Proben. Bei entfernten oder mehrfach gleich benannten Proben wird nicht automatisch geraten.

Waffen stehen in einem gemeinsamen Block mit Talentwert und getrennten AT-/PA-Aktionen. Name und Wertplakette lösen denselben normalen Wurf wie der Würfelknopf aus; die Bestandteile stehen im Hinweis über AT/PA/FK. Auch Namen in Schnellleiste und Probenring sind anklickbar. Ziehen auf die Makroleiste löst keinen Wurf aus. Der Kopf enthält Knöpfe für das **Kampfbrett**, den **Probenring** mit sechs Favoriten und die Rückkehr zur vollständigen Ansicht. Kampfbrett und normale Probenansicht teilen Charakter, nächsten Modifikator sowie dieselbe Fenstergröße und Position. Der Schwert-und-Schild-Knopf wechselt die Ansicht innerhalb des vorhandenen Fensters. Der gespeicherte Fokus gilt für Kampfproben und wird nur im Kampfbrett angezeigt.

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

**Austauschpaket** exportiert die beim Import mitgeführte JSON mit aktuellen Rüstungszuständen und ein erreichbares Portrait aus der Foundry-Welt. Alte Importe benötigen dafür einmalig einen erneuten Originalimport. Rüstungsänderungen und ausgewählte Gefolgs-Probenattribute werden in der exportierten JSON berücksichtigt. Beim Export werden die drei Fokuswerte auf den aktuellen Foundry-Stand gesetzt und der Portraitdateiname passend zur beiliegenden Bilddatei gespeichert; alle übrigen Originalfelder bleiben erhalten. Die ursprüngliche Windows-Datei wird nicht verändert. Das Paket kann in einer anderen Foundry-Welt importiert werden. Windows-Daten werden weiterhin bewusst über Dateien und den Ordner CharacterPortraits übernommen, nicht automatisch synchronisiert.

Eine gemeinsame Ergebnis-/Proben-Schnittstelle mit Ucurifunke und ein eigener Paketexport in der Windows-App benötigen weiterhin Abstimmung mit deren Entwickler. Das Modul verändert keine fremde Regelauswertung. Ergebnissiegel und Erfolgs-/Patzerklänge bleiben bis zu einer verlässlichen Ergebnisanbindung aus.

## Ork-Darstellung

Unter **Darstellung → Ork** wird das Fenster zu einer groben Holz- und Lederoberfläche mit Knochen, Stoßzähnen und einfachen Beschriftungen. Beispielsweise: **Blatt holen**, **Was tun?**, **Schwer. Aua.**, **Kampf-Laune** und **Oberboss!**. Auch Importfenster und eigene Fehlermeldungen verwenden diese Sprache. Die Sprache verwendet kurze, einfache Sätze. Die Stärkeabstufungen bleiben sichtbar. Talente erhalten einfache Anzeigenamen, etwa **Welt wissen** für Geographie oder **Aua weg machen** für Heilkunde. Der ursprüngliche Talentname steht klein darunter, auch in Favoriten und im Probenring. Unbekannte eigene Talente heißen **Extra Ding können** mit ihrem Originalnamen darunter. Waffen- und Charakternamen sowie die gespeicherten Daten, Würfelbefehle und Chatkarten bleiben in ihrer ursprünglichen Form. Suche akzeptiert beide Namen. Beim Wechsel zur normalen Sprache kehren die ursprünglichen Beschriftungen zurück.

## Talentstärken erkennen

Das Pergament wird mit höherem Gesamtwert des Talents schrittweise heller und feiner. Wert 0 erscheint mit einem gerissenen Wertfeld. Unter 10 erscheint kein Lorbeerkranz. Ab 10 hebt der goldene Lorbeerkranz mit Stern das Talent hervor. Der Hinweis am Wertfeld erklärt die Abstufung: 0 ungeübt, 1–3 Grundlagen, 4–6 geübt, 7–9 versiert und 10+ meisterlich. Diese Bezeichnungen dienen der Orientierung in der Oberfläche; sie ändern keine Regeln oder Würfelwerte. Attribute verwenden eine eigene Skala: 1 sehr schwach, 10 durchschnittlich und ab 20 meisterlich. Widerstands- und Reaktionsproben bleiben ohne Stärke-Einstufung.

Kampftalente tragen den Meisterkranz ab Talentwert 20. Maßgeblich ist der Wert der besten verwendeten Waffentechnik, bevor Basis, Fokus, Waffenbonus und Behinderung einfließen. Dieser Talentwert steht unter dem Waffennamen; die Spalte **Wert** zeigt weiterhin den fertigen AT-/PA-/FK-Probenwert. Gefolgsangriffe haben fertige AT-/PA-/FK-Werte und erhalten keine Talentstufe.

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

## Kampf und Gefolgsproben

Unter **Kampf** stehen Angriff und Parade für Nahkampfwaffen, Schilde und Parierwaffen sowie Fernkampfangriffe. Die beste erlaubte Waffentechnik wird wie in Pedipalpus ausgewählt; bei Gleichstand bleibt die Reihenfolge der Waffe erhalten. Der Wert enthält Fertigkeit, Basis, Fokus, Waffenbonus und wirksame Behinderung. Nahkampf verwendet `max(0, BE − Waffentoleranz)`, Fernkampf `max(0, BE − 2)`. Der Hinweis über **AT / PA / FK** zeigt die Bestandteile. Situative Modifikatoren werden über **Nächste Probe** eingestellt.

Unter **Tierproben**, **Dämonen** und **Untote** stehen die jeweiligen eigenen Attribute, geistige/körperliche Magieresistenz sowie gespeicherte Angriffe, Paraden und Fernkampfangriffe. Bei Fernkampfangriffen erscheint ausschließlich FK, keine erfundene Parade. Fertige AT-/PA-/FK-Werte werden ohne Charakterbasis, Fokus oder Behinderung übernommen. Schaden, Sonderfolgen und Beschwörungskosten werden nicht automatisch abgewickelt.

Profane und magische Fähigkeiten der Wesen verwenden ihren gespeicherten Probenwert. Vor dem Wurf lassen sich drei eigene Attribute auswählen; doppelte Attribute sind erlaubt. Die zuletzt gewählten Attribute bleiben pro Wesen und Fähigkeit gespeichert, auch bei einem erneuten Import ohne vorgegebene Attribute. Neue Vorgaben aus Pedipalpus haben Vorrang. Ein optionaler Probenname gilt nur für diesen Wurf. Abbrechen verbraucht den nächsten Modifikator nicht. Dasselbe gilt für verdeckte Würfe und Makros bei geschlossenem Fenster.

Vorhandene Importe mit gespeicherter Original-JSON werden beim Öffnen für das neue Gefolgeformat ergänzt. Alte Tiere bleiben Tiere; ein dort eingetragenes Skelett wird nicht automatisch in eine andere Liste verschoben. Fehlen Pflichtwerte, werden keine Ersatzwerte erfunden. Neue oder in Pedipalpus geänderte Wesen benötigen **Aktualisieren** oder einen erneuten Import in denselben Foundry-Charakter. Die Dateiversion bleibt 17; Dämonen, Untote und Chimären sind zusätzliche optionale Listen.

Die Auswertung erfolgt über Ucurifunke – Proben 1.0.14. Dessen Kampfregeln unterscheiden sich in Randfällen vom neuen lokalen Pedipalpus-Würfelmodus: Die lokale Qualitätsdeckelung bei Netto-Erleichterung und die automatische Erfolgs-/Misserfolgsregel für natürliche 1/20 sind in Foundrys veröffentlichtem Modul noch nicht vollständig gleich umgesetzt. Für eine einheitliche Auswertung muss das Probenmodul entsprechend aktualisiert werden.

## Kampffokus

Im Kampfbrett den **Fokus** zwischen DEF (links) und OFF (rechts) einstellen, von −4 bis +4 wie in Pedipalpus. Angriff und Parade ändern sich sofort gegensinnig; Fernkampf, sämtliche Gefolgsproben und Talentstärken bleiben gleich. Der Fokus wird am Foundry-Charakter gespeichert und gilt bis zur nächsten Änderung. Besitzer dürfen ihn ändern, Beobachter können ihn sehen. Vorhandene Kampfimporte ab 0.7.0 sind direkt nutzbar. Ein neuer JSON-Import übernimmt wieder den Fokus aus der importierten Datei. Die lokale Windows-Datei wird nicht verändert.

## Charakter- und Tokenbilder

Das kleine Profilbild oben links anklicken oder **Werkzeuge → Charakterbild importieren** öffnen. Ein vorhandenes Bild wird geladen; eine neue Bilddatei kann dort ebenfalls ausgewählt werden. In der runden Vorschau das Bild mit der Maus verschieben, bei Bedarf mit **Vergrößerung** näher heranholen. Alternativ die Pfeiltasten verwenden; mit Umschalt größere Schritte. **Ausschnitt zurücksetzen** stellt Mitte und Ausgangsgröße wieder her. Anschließend **Bild übernehmen** wählen.

Der gewählte Ausschnitt samt Rahmen wird je Charakter in Foundry gespeichert, beim Wiederöffnen und beim Aktualisieren aus der JSON wieder verwendet. Das vollständige Originalbild bleibt erhalten; Token-Vorlage, bearbeitbare verknüpfte Tokens und das kleine Profilbild verwenden den runden Ausschnitt. Abbrechen verwirft Änderungen am Bildausschnitt. Bereits hinzugefügte eigene Rahmen bleiben in deiner Auswahl. Für Begleiter dieselbe Vorschau unter **Bild / Token** verwenden. Bereits in Foundry geänderte Bilder oder Begleiterzuordnungen müssen vor einer Übernahme erneut geöffnet werden. Der Ausschnitt wird nicht in die lokale Windows-Datei zurückgeschrieben.


Pedipalpus speichert das Bild separat unter `CharacterPortraits`; die JSON enthält nur `PortraitFileName`. Beim Import **Pedipalpus-Ordner auswählen** und den Ordner mit `SavedCharacters` und `CharacterPortraits` freigeben. Nach der Charakterauswahl findet das Modul das zugehörige Bild automatisch. Alternativ JSON und Bild gemeinsam auswählen, ein Charakter-ZIP importieren oder ein manuelles Bild hinzufügen. Das Modul liest ausschließlich ausgewählte bzw. ausdrücklich freigegebene Dateien.

PNG, JPG/JPEG, BMP und WebP bis 10 MB werden unterstützt. BMP wird für Foundry in PNG umgewandelt. Das vollständige Bild bleibt als Charakterportrait erhalten. Für die Token-Vorlage entsteht ein separates rundes PNG mit transparentem Außenbereich und dem ausgewählten Rahmen. Bearbeitbare verknüpfte Tokens erhalten dieses Tokenbild. Unverknüpfte Tokens und Tokens anderer Charaktere behalten ihre Bilder. Ohne Bildauswahl bleiben sämtliche bestehenden Bilder erhalten. Die Übernahme benötigt Foundry-Uploadrechte; fehlende Tokenrechte werden gemeldet. Die Bilder werden im Datenordner der Welt gespeichert und gehören nicht zum Modul-Release.

## Eigene Tokenrahmen

Im Bildeditor oder unter **Einstellungen → Eigenen Rahmen hinzufügen** eine transparente PNG- oder WebP-Datei auswählen. Auch rechteckige Vorlagen werden proportional übernommen. Der Rand muss geschlossen sein und eine transparente Mitte für das Charakterbild besitzen; außen bleibt das Token transparent. Unterstützt sind 16–2048 Pixel je Seite und Bilder bis 10 MB.

Der Rahmen wird beim Hinzufügen dauerhaft für deinen Foundry-Benutzer in dieser Welt gespeichert und erscheint anschließend unter **Tokenrahmen**, auch für neue Charaktere, NSCs und Begleiter. Dieselbe Datei erneut hinzuzufügen erzeugt kein Duplikat. Das Hinzufügen ist unabhängig vom späteren Speichern oder Abbrechen des Bildausschnitts. Bis zu 50 eigene Rahmen können gespeichert werden. Zum Hochladen sind die üblichen Foundry-Uploadrechte nötig; ein Spielleiterkonto ist dafür nicht erforderlich.

Bereits mit eigenen Rahmen erstellte Charaktere und Begleiter behalten die benötigten Bildverweise. Andere berechtigte Nutzer können deren Bildausschnitt daher ebenfalls weiterbearbeiten, auch wenn sie den Rahmen nicht in ihrer persönlichen Auswahl haben. Die bisherigen Concrete-, Silver-Thin- und Undead-Rahmen bleiben nutzbar. Eigene Rahmen werden auf dem Foundry-Server gespeichert und nicht in die lokale Pedipalpus-Datei oder auf GitHub übernommen.

## Werte aktualisieren

Werte in Pedipalpus ändern, speichern und die JSON-Datei erneut **in denselben Foundry-Charakter** importieren. Bilder, Besitzerrechte und Token-Verknüpfungen bleiben erhalten. Es gibt keine automatische Synchronisierung mit der Windows-App oder den Foundry-Ressourcenfeldern.

Vorhandene Importe aus früheren Modulversionen bleiben verwendbar; für die bisherigen Talent- und Attributsproben ist kein erneuter Import erforderlich. Neu in Pedipalpus gespeicherte Kampf- und Gefolgsdaten benötigen Aktualisieren oder einen erneuten Import; bereits mitgeführte Originaldaten bleiben erhalten. Ein erneuter Import ersetzt auch Änderungen aus der früheren Bearbeitungsoberfläche. Die Speicherdateiversion 17 ist geprüft; andere Versionen erfordern einen Wertevergleich.

## Optionales Makro

```js
game.modules.get('pedipalpus-foundry').api.open();
```

## Krieger, Magie und Alchemy

**Krieger** zeigt schwere Metallplatten mit Nieten, Lederriemen, Schwertklingen und Schild. **Magie** verwendet dunkles Violett/Blau, rotierende Runenkreise, arkanes Licht und funkelnde Partikel. **Alchemy** basiert auf schwarzem Leder mit wenigen giftgrünen Akzenten und einer animierten Flasche mit aufsteigenden Säurebläschen. Die Messer wurden entfernt. Alle Designs werden persönlich gespeichert und beachten Animationen Aus sowie reduzierte Bewegung.

## Aktualisieren von der letzten Quelle

**Aktualisieren** neben **JSON importieren** liest die zuletzt freigegebene Datei erneut und zeigt vor der Übernahme den Importvergleich. Dafür beim Import **Datei auswählen** oder **Pedipalpus-Ordner auswählen** verwenden. Unterstützte Browser speichern die Dateifreigabe pro Foundry-Benutzer, Welt und Charakter im jeweiligen Browser; Zugriffe bleiben lesend. Nach einem Browserneustart kann die Freigabe erneut abgefragt werden. Bei fehlendem Zugriff, einer verschobenen Datei oder Browsern ohne dauerhaften Dateizugriff öffnet sich die Importauswahl erneut. Es wird kein alter Dateistand als Aktualisierung ausgegeben.

## Rüstungen und Gefolge im Kampfbrett

Im Bereichsfilter des Kampfbretts stehen **Rüstungen**, **Tierproben**, **Dämonen** und **Untote**. Rüstungen zeigen RS, Basis-BE sowie die aus Pedipalpus übernommenen Zustände **Dabei** und **Angelegt**. Besitzer können beide Häkchen ändern. Ablegen entfernt auch Angelegt; eine bei einem Tier gelagerte Rüstung kann nicht am Charakter angelegt werden. Rüstschutz, Last/Überlastung und Behinderung folgen den gespeicherten Pedipalpus-Feldern; Kampfwürfe verwenden die aktualisierte BE. Bei fehlender Basis-BE ist zuerst ein neuer Pedipalpus-Speicherstand nötig. Änderungen werden in Foundry und im Austauschpaket gespeichert; die Windows-Datei bleibt unberührt. Checkboxen passen sich dem gewählten Design an.

Die drei Gefolgsübersichten zeigen auch Wesen ohne Angriffe, mit gespeicherter LE und gegebenenfalls AE. **Bild / Token** lädt ein Portrait hoch und erstellt einen eigenen, verknüpften Foundry-Charakter mit allen eigenen Gefolgsproben und dem ausgewählten Rahmen. Den Eintrag aus dem Charakterverzeichnis auf die Szene ziehen. Ein späterer Bild-/Rahmenwechsel aktualisiert denselben Eintrag. Stabile Pedipalpus-Gefolgskennungen bzw. eindeutige Namen verhindern eine falsche Zuordnung; ein erneuter Eltern-Import aktualisiert die Gefolgsproben und behält Portrait/Tokenbild. Entfernte oder mehrdeutige Begleiter behalten ihren Eintrag, haben aber keine veralteten Proben. Erstellung benötigt die Foundry-Berechtigung zum Anlegen von Charakteren.

## Private Originalrahmen

Die Originalrahmen werden separat importiert und sind nicht im öffentlichen Modul oder auf GitHub enthalten. Ein Spielleiter lädt das private Rahmen-ZIP einmal über **Werkzeuge → Einstellungen → Originalrahmen importieren** in die Welt. Das Paket enthält `concrete.png`, `concrete-mask.png`, `silver-thin.png`, `silver-thin-mask.png`, `undead.png` und `undead-mask.png`. Danach nutzen alle Benutzer die Rahmen aus den Weltdaten. **Concrete** ist Standard; **Silver, Thin** und **Undead** stehen unter Tokenrahmen zur Wahl. Ohne importiertes Rahmenpaket wird zunächst ein rundes Token ohne Originalring erstellt. **Token aktualisieren** erstellt aus dem vorhandenen Charakterportrait ein neues Tokenbild mit dem gewählten Rahmen. Für Tier-, Dämonen- und Untotenportraits steht dieselbe Auswahl direkt am Wesen zur Verfügung.

## Begleiter ohne Angriffe

Begleiter werden im Kampfbrett unter **Tierproben**, **Dämonen** bzw. **Untote** angezeigt, auch wenn noch keine Angriffe gespeichert sind. Eigene gespeicherte Attribute und Fähigkeiten bleiben unabhängig davon würfelbar. Angriff und Parade lassen sich erst würfeln, wenn diese Werte in der Pedipalpus-Datei enthalten sind. Nach Änderungen in Pedipalpus speichern und den vorhandenen Foundry-Charakter über **Aktualisieren** oder einen erneuten JSON-Import aktualisieren; ein Modulupdate alleine verändert die importierten Charakterdaten nicht.
