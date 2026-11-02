# Pedipalpus – Proben · 1.11.15

Pedipalpus-Charaktere importieren und ihre Proben direkt in Foundry würfeln.

1.11.15 macht die vollständige Favoritenliste direkt aus der Schnellleiste erreichbar. Vorhandene Charakter-, NSC- und Gefolgsimporte bleiben unterstützt.

## Pedipalpus als Grundlage

Dieses Modul ergänzt die Windows-App **Pedipalpus von [Tschuangtse](https://github.com/Tschuangtse)**. Zum Spielen wird eine dort erstellte und gespeicherte Charakterdatei oder eine NSC-Datei aus dem eigenständigen NSC-Generator im selben Originalprojekt benötigt. Charaktererstellung und Steigerungen erfolgen in Pedipalpus; dieses Modul bringt die importierten Proben nach Foundry.

- [Pedipalpus – unser Fork des Originalprojekts von Tschuangtse](https://github.com/antoraxger-prog/Pedipalpus)

Der Fork ist derzeit privat und nur für GitHub-Konten mit Zugriffsfreigabe erreichbar. Dieses Foundry-Modul enthält die Windows-App nicht; bereits importierte Charaktere bleiben auch ohne laufende Windows-App verwendbar.

## Voraussetzungen

- Foundry VTT 14
- Simple Worldbuilding
- Ucurifunke – Proben 1.0.14 für Kampf- und Gefolgsproben; ohne diese Proben bleiben 1.0.8–1.0.14 nutzbar

## Alle Favoriten aus der Schnellleiste in 1.11.15

Bei mehr als sechs aktuellen Favoriten zeigt die Schnellleiste beispielsweise „6 / 60“ und den Knopf „Alle Favoriten“. Er wechselt zum vorhandenen Favoritenfilter der Probenansicht, leert die Suche und zeigt die Liste von oben. Die Schnellleiste klappt dabei zu, damit mehr Platz für die vollständige Liste bleibt. Mit höchstens sechs Favoriten bleibt die bisherige kompakte Kopfzeile erhalten.

Der Modifikator für die nächste Probe bleibt erhalten. Der Zugang funktioniert auch per Tastatur und für Beobachter; Würfelrechte werden dadurch nicht erweitert. Im Ork-Modus heißt er „Alle Lieblingsdinge“. Reihenfolge, nicht mehr verfügbare gespeicherte Referenzen und die getrennten Favoriten je Figur bleiben erhalten; kein Neuimport erforderlich.

## Deutlicherer Tastaturfokus in 1.11.14

Bei aktiviertem erhöhtem Kontrast erhalten fokussierte Bedienelemente einen stärkeren Rahmen. Am Fertigkeitswert unterscheidet er sich dadurch deutlich von der dauerhaft sichtbaren dünnen Umrandung. Der Rahmen bleibt auch bei reduzierter Bewegung sichtbar; ohne erhöhten Kontrast bleibt die bisherige Fokusdarstellung erhalten.

Ausgewählte Favoritensterne im Aristocrat-Design verwenden in Probenliste und Schnellleiste einen dunkleren Goldton, damit sie auf dem hellen Papier klarer erkennbar sind. Favoritenauswahl, Würfelverhalten, Daten und persönliche Einstellungen bleiben erhalten; kein Neuimport erforderlich.

## Zustandsfelder in schmalen Fenstern in 1.11.13

Im Spielstandsfenster dürfen Zustandswert und Unterdrückung bei wenig Platz auf getrennte Zeilen umbrechen. Dadurch ragt beispielsweise „Überanstrengung“ bei größerer UI-Schrift nicht mehr seitlich aus dem verfügbaren Bereich.

Speichern, Abbrechen, Plus-/Minusknöpfe und die Energieübernahme zwischen Hauptfigur und verknüpften Begleitern behalten ihre bisherigen Funktionen. Datenformat, Werte und Rechte bleiben erhalten; kein Neuimport erforderlich.

## Begleiter in der Charakterauswahl unterscheiden in 1.11.12

Verknüpfte Begleiter tragen in der Charakterauswahl den Zusatz „Gefolge: Hauptfigur“. So lassen sich gleichnamige Tiere, Dämonen und Untote verschiedener Figuren unterscheiden. Der Zusatz folgt dem aktuellen Foundry-Namen der Hauptfigur. Im Ork-Modus steht dort schlicht „Bei: Hauptfigur“.

Ist die Hauptfigur nicht sichtbar oder nicht mehr vorhanden, erscheint nur „Gefolge“, ohne ihren Namen offenzulegen. NSC-Kennzeichnungen bleiben erhalten. Die Beschriftung vergibt keine Rechte und ändert weder Namen noch Zuordnungen oder Charakterdaten; kein Neuimport erforderlich.

## Begleiter mit der Tastatur erreichen in 1.11.11

Pfeil hoch/runter sowie Pos1/Ende berücksichtigen bei zugeklappten Begleitern nur die sichtbaren Schnellwürfe. Die Navigation bleibt dadurch beim Wechsel vom Tier zum Dämon oder Untoten nicht mehr an einer ausgeblendeten Probe hängen.

Bei geöffneten Begleitern sind ihre sichtbaren Proben erreichbar. Die Suche und gemischt auf-/zugeklappte Listen bleiben unterstützt. Enter auf einem gewählten Würfelknopf löst weiterhin genau diese normale Probe aus. Charakterdaten, Rechte und gespeicherte Einstellungen bleiben erhalten; kein Neuimport erforderlich.

## Schmale Einstellungs- und Notizfenster in 1.11.10

Einstellungsfelder können bei Platzmangel unter ihre Beschriftung umbrechen. Auswahlfelder und Datei-Importfelder bleiben innerhalb des verfügbaren Inhaltsbereichs, auch bei längeren Namen eigener Tokenrahmen. Die Lautstärkeanzeige und das Mausrad-/Würfelverhalten bleiben unverändert.

Lange Regeltexte und Links im Info-/Notizfenster werden umgebrochen. Der Text wird dabei nicht gekürzt oder umgeschrieben. Notizeingabe, Zeichenanzeige und Strg-/Command+Enter bleiben unterstützt.

Die Darstellung wurde bei schmalen Dialogen mit größerer UI-Schrift und in allen neun Designs geprüft. Speichern und Abbrechen behalten ihre bisherigen Funktionen. Gespeicherte Werte, Quelldaten, Bilder und Rechte bleiben erhalten; kein Neuimport erforderlich.

## Waffenset-Auswahl nachvollziehen in 1.11.9

Mehrfach gleichnamige Waffen verschwinden nicht mehr kommentarlos aus der Set-Auswahl. Sie erscheinen ausgegraut mit dem Hinweis, sie in Pedipalpus eindeutig zu benennen. Das Waffenset-Fenster lässt sich auch öffnen, wenn nur solche Waffen vorhanden sind. Eine mehrdeutige Waffe wird weiterhin keinem Set zugeordnet.

Gespeicherte Sets mit fehlenden oder nicht mehr eindeutigen Waffen tragen in der Auswahl den Zusatz „Unvollständig“. Im Waffenset-Fenster werden die betroffenen Waffennamen genannt. Beim aktiven unvollständigen Set bleibt wie bisher die vollständige Waffenliste sichtbar. Das Set wird weder automatisch gelöscht noch umgeschrieben.

Eindeutige Waffen können weiterhin für neue Sets ausgewählt werden. Abbrechen erhält die bisherige Auswahl, und alte Sets werden nur nach ausdrücklicher Auswahl zum Entfernen gelöscht. Begleiter, importierte Charakterdaten und Nebenhandregeln bleiben erhalten. Beschriftungen des Waffenset-Fensters passen auch zum Ork-Modus.

Kein Neuimport und keine Änderung der gespeicherten Set-Struktur erforderlich.

## Notizfenster und Ork-Beschriftungen in 1.11.8

Das Info-/Notizfenster verwendet nun ebenfalls die passende Sprache für Titel, Beschriftungen und Knöpfe. Im Ork-Modus steht der ursprüngliche Probenname klein unter dem vereinfachten Titel. Die importierten Regeltexte, Werte und Schadensformeln bleiben wortgetreu erhalten; unbekannte zusätzliche Überschriften werden ebenfalls unverändert angezeigt.

Beim Öffnen steht die Eingabemarke am Ende der vorhandenen Notiz. Eine Zeichenanzeige zeigt den Platz innerhalb der bisherigen Begrenzung von 2000 Zeichen. Enter bleibt ein Zeilenumbruch; Strg+Enter oder Command+Enter speichert über denselben Knopf wie bisher. Schließen verwirft ungespeicherte Änderungen.

Die Notizmarkierung, Suche und Trennung nach Person und Figur bleiben erhalten. Kein Neuimport und keine Änderung der gespeicherten Notizstruktur erforderlich.

## Eigene Spielnotizen wiederfinden in 1.11.7

Ein kleiner Punkt am Info-Knopf zeigt, dass zu dieser Probe eine eigene Spielnotiz gespeichert ist. Die bestehende Suche berücksichtigt nun auch den Notiztext: Namen und Notizwörter lassen sich kombinieren, Umlaute funktionieren wie bisher auch als ae/oe/ue. Das gilt für Fertigkeiten, eigene Kampfproben und Begleiter im jeweiligen Fensterbereich.

Die Notizen bleiben getrennt nach Person und Figur. Sie werden weiterhin im Infofenster bearbeitet und erst mit „Notiz speichern“ übernommen. Abbrechen erhält den bisherigen Text; eine leere oder nur aus Leerzeichen bestehende Notiz entfernt Markierung und Suchtreffer. Beim Würfeln wird der Notiztext nicht in den Chat übernommen.

Nach einem neu sortierten Import folgt die Notiz ihrer eindeutigen Probe. Bei mehrfach vorhandenen gleichen Proben wird die gespeicherte Notiz keiner davon zugewiesen; sie bleibt für eine spätere eindeutige Zuordnung erhalten. Importierte Daten, Bilder und Rechte werden durch Notizen und Suche nicht verändert. Alle neun Designs sind unterstützt, im Ork-Modus heißt die Markierung „Merktext da“.

Kein Neuimport und keine Änderung der gespeicherten Notizstruktur erforderlich.

## Schadensänderungen beim Import vergleichen in 1.11.6

Der Importvergleich nennt nun auch geänderte Schadensformeln mit bisherigem und neuem Wert. Eine reine Schadensänderung öffnet damit ebenfalls den Vergleich, selbst wenn Angriffswert, Attribute und Berechnung unverändert sind. Das gilt für eigene Waffen, Begleiterangriffe und das getrennte NSC-Datenmodell.

Erhält eine bereits vorhandene Probe erstmals eine Schadensformel oder fällt sie weg, erscheint das ebenfalls im Vergleich. Fehlende und leere Angaben zählen gleich; unveränderte Schadensdaten erzeugen keine zusätzlichen Dialoge. Bei mehrdeutigen Probenzuordnungen bleibt die vorhandene Warnung erhalten, statt Schäden einer Waffe zu erraten.

Abbrechen erhält die bisherige Figur. Erst Übernehmen importiert die neuen Daten nach den bestehenden Regeln. Bilder, Token-Zuordnungen, Besitzerrechte und die getrennten Charakter-/NSC-Importziele bleiben erhalten. Kein Neuimport bestehender Figuren erforderlich.

## Begleiter im Kampf im Blick behalten in 1.11.5

Tiere, Dämonen und Untote zeigen unter ihrer LE-Zahl eine kleine Lebensenergieleiste, auch bei eingeklappten Proben. Grün steht für mehr als die Hälfte, Gold für bis zur Hälfte; bei höchstens einem Viertel erscheint eine rot schraffierte Anzeige. Bei null oder negativen LE bleibt eine leere, schraffierte Markierung. Die genauen Zahlen sind weiterhin sichtbar und werden auch für die Sprachausgabe benannt.

Ein Klick auf Zahl oder Leiste öffnet wie bisher den Energie-Editor. Negative Werte und Werte über dem Maximum bleiben erhalten; nur die grafische Füllung wird auf 0–100 % begrenzt. Bei unbekanntem oder nicht positivem Maximum erscheint keine irreführende Leiste. Die Anzeige löst keine Regelabzüge, Zustände oder Datenänderungen aus.

Alle Designs bleiben unterstützt; der Ork-Modus nennt den Editor „Kraft ändern“. Bestehende Figuren und Bilder bleiben erhalten, ein Neuimport ist nicht erforderlich.

## Favoriten per Tastatur ordnen in 1.11.4

Beim Verschieben bleibt der Fokus auf dem verschobenen Favoriten. Am Anfang und Ende sind unpassende Richtungspfeile gesperrt; erreicht ein Favorit den Rand, wechselt der Fokus zum verfügbaren Gegenpfeil. Nach dem Entfernen folgt der nächste Eintrag, beim letzten Eintrag der vorherige. Ist die Liste leer, bleibt der Fokus im Favoritenbereich.

Die Schaltflächen nennen für die Sprachausgabe zusätzlich den zugehörigen Probennamen und zeigen einen deutlichen Tastaturfokus. Abbrechen verwirft die geänderte Reihenfolge und entfernte Favoriten; erst Speichern übernimmt sie. Die Bereinigung nicht mehr verfügbarer Favoriten bleibt eine ausdrückliche Aktion.

Bestehende Einstellungen, Figuren und Favoriten bleiben erhalten. Kein Neuimport erforderlich.

## Begleiterbilder und Spielstandsfenster in 1.11.3

Der separate Bild-/Token-Editor eines Begleiters prüft vor und nach den Uploads, ob Hauptfigur und bisheriger Begleiter noch dieselben aktuellen Foundry-Einträge sind. Entfernte Figuren, ersetzte Einträge mit gleicher Kennung und geänderte Quellzuordnungen stoppen den Vorgang vor den Begleiteränderungen. Dadurch entsteht aus einer während des Uploads gelöschten Hauptfigur kein neuer verwaister Begleiter.

Für einen neuen Begleiter werden die Erstellungsrechte nach dem Upload erneut geprüft. Bereits vorhandene eigene Begleiter dürfen weiterhin ein neues Bild erhalten, auch wenn der Spieler keine neuen Figuren anlegen darf. Rechte, bestehende Zuordnungen und aktuelle Werte werden bei den erkannten Abbrüchen erhalten. Bereits hochgeladene Bilddateien werden nicht automatisch gelöscht.

Ein schon geöffnetes Spielstandsfenster kann keine Energien mehr auf ein inzwischen entferntes oder durch einen anderen Eintrag ersetztes Hauptblatt schreiben. Bestehende Begleiter werden dabei nicht synchronisiert oder verändert. Normales Speichern und Wiederholen fehlgeschlagener Begleiteraktualisierungen bleiben erhalten.

Kein Neuimport bestehender Figuren erforderlich. Die Prüfung ersetzt keine gemeinsame Transaktion über mehrere Dokumente.

## Import und Export absichern in 1.11.2

Ein Import prüft seine Zielfigur erneut vor und nach dem Speichern der Werte sowie vor späteren Bild-/Besitzeraktionen. Wurde die Figur entfernt, ersetzt, erneut geändert oder ist sie nicht mehr bearbeitbar, stoppen die verbleibenden Aktionen mit einem Hinweis. Ein gelöschter Hauptcharakter kann keine neuen Begleiter-Einträge mehr erzeugen; bestehende Begleiter bleiben erhalten. Bei neuen Figuren werden nach einem Bildupload die Erstellungsrechte und eine gewählte Spielerzuweisung erneut geprüft.

Beim Austauschpaket werden Figur, Besitzerzugriff, Daten, Name und Originalbild vor dem Download erneut abgeglichen. Eine inzwischen gewechselte, entfernte oder veränderte Figur erzeugt kein veraltetes Paket. Eine reine Änderung des Tokenbilds blockiert den Export des unveränderten Originalportraits nicht. Der Dateiname stammt aus derselben Figur wie die exportierten Daten.

Nach einer Speicherung zählen die tatsächlich übernommenen Felder und Arrayeinträge. Eine andere Reihenfolge von Objektfeldern und zusätzliche unberührte Metadaten verursachen keinen falschen Konflikt; diese Prüfung gilt auch nach einer gespeicherten NSC-/Begleiter-Attributwahl.

Bereits abgeschlossene Teilaktionen werden bei einem späteren Konflikt nicht zurückgerollt. Es gibt keine gemeinsame Transaktion über Charakter, Bilder und Begleiter. Neuere Werte werden erhalten; ein Hinweis fordert zum erneuten Vergleichen auf. Kein Neuimport vorhandener Figuren und keine Datenmigration nötig.

## Laufende Würfe absichern in 1.11.1

Ändert sich eine Waffe oder ihre Schadensformel während eines laufenden Schadenswurfs, wird die alte Nachricht nicht mehr gesendet. Das gilt auch, wenn die Waffe entfernt oder ihre Probe inzwischen gesperrt wurde. Nach dem Hinweis kann mit einem neuen Klick der aktuelle Schaden gewürfelt werden. Eine währenddessen geänderte Token-Zuordnung oder ein aus der Szene entfernter Token stoppt ebenfalls die alte Schadensnachricht. Eine Änderung ohne Einfluss auf diese Waffe blockiert den Wurf nicht.

Auch während einer noch laufenden Fokusspeicherung werden die ursprünglich angeklickten Schadenswerte festgehalten und vor dem Auswerten erneut geprüft. Ein Schadenswurf verbraucht weiterhin keinen Modifikator für die nächste Probe.

NSC- und Begleiterproben prüfen nach dem Speichern der gewählten Attribute noch einmal Werte, Besitzerrechte, Figur und gegebenenfalls Hauptcharakter/Zuordnung. Zwischenzeitlich geänderte Daten werden nicht für einen veralteten Wurf verwendet. Bereits gespeicherte Attributwahlen können dabei erhalten bleiben; neuere Daten werden nicht zurückgerollt. Die unveränderte Würfelanbindung bleibt bestehen.

Kein Neuimport oder Datenumbau nötig.

## Weniger neu suchen in 1.11.0

Beim Wechsel zwischen **Proben** und **Kampf** merkt sich jeder Bereich seine Suche, Kategorie, Listenposition und den Zustand der Schnellleiste. Auch ein Besuch des Probenrings erhält die vorherige Ansicht. Die Merkhilfe gilt im laufenden Modulfenster getrennt je Figur; eine andere Figur erhält nicht den Suchtext der vorherigen. Fenstergröße und Position bleiben beim Wechsel zwischen Proben und Kampf erhalten. Es werden dafür keine Charakterwerte oder neuen dauerhaften Einstellungen gespeichert.

Ist eine gemerkte Kategorie nach einem Import nicht mehr vorhanden, fällt die Ansicht auf **Alle Proben** zurück. Bei einer Suche ohne Treffer oder einer leeren Favoritenliste führt **Alle Proben anzeigen** direkt zurück: Suche und Filter werden geleert, die Liste beginnt oben und die Suche erhält den Fokus. Der Knopf erscheint nur bei leeren Ergebnissen.

**Pos1** und **Ende** springen von einem fokussierten Probenknopf zur ersten oder letzten sichtbaren normalen Würfelaktion. Im Suchfeld behalten die Tasten ihre normale Funktion für den Textcursor. Die Navigation löst keinen Wurf aus und überspringt gesperrte Aktionen. **Enter** auf einem gewählten Würfelknopf würfelt weiterhin ausdrücklich. Neue Texte sind auch in Ork-Sprache verfügbar.

Kein Neuimport und keine Datenmigration erforderlich.

## Bildeditor und eigene Rahmen in 1.10.1

Schlägt das Laden einer neuen Bilddatei oder eines anderen Rahmens fehl, bleibt die Übernahme gesperrt. **Letztes gültiges Bild** stellt auf Wunsch die vorherige gültige Vorschau mit Ausschnitt, Vergrößerung und Rahmen wieder her. Das lädt nichts hoch und ändert keine gespeicherte Figur. Erst **Bild übernehmen** speichert wie gewohnt; **Abbrechen** erhält das bisherige Bild. Ohne vorherige gültige Vorschau wird keine Wiederherstellung angeboten.

Das Abbrechen einer Dateiauswahl lässt die Vorschau bestehen. Dieselbe Datei kann erneut gewählt werden, etwa nach einem vorübergehenden Ladefehler. Hinweise und Knöpfe des Bildeditors berücksichtigen die gewählte Ork-Sprache.

Mehrere gleichzeitig geöffnete Dialoge speichern eigene Rahmen im selben Browser nacheinander. Die persönliche Sammlung wird vor jeder Speicherung frisch gelesen, vorhandene Rahmen bleiben erhalten, doppelte Bilder werden wiederverwendet und die Grenze von 50 eigenen Rahmen bleibt wirksam. Ein fehlgeschlagener Speicherversuch blockiert spätere Importe nicht. Eine Synchronisationssperre zwischen verschiedenen Browsern ist damit nicht verbunden.

Bestehende Bilder, Ausschnitte und Figuren benötigen keinen Neuimport.

## Würfelmakros, Begleiter und Favoriten in 1.10.0

Normale und verdeckte **Würfelknöpfe** lassen sich auf die Foundry-Makroleiste ziehen. Ein vom durchgestrichenen Auge gezogenes Makro merkt sich den verdeckten Wurf und trägt den Namenszusatz **Verdeckt**. Das Ziehen würfelt nicht. Die Makros verwenden weiterhin die aktuelle eindeutig zugeordnete Probe statt eines fest gespeicherten Zahlenwerts.

Ersetzte Begleiter, fehlende Hauptcharaktere sowie entfernte oder mehrdeutige Gefolgszuordnungen werden vor Würfen über das Modul und seine öffentliche Makroanbindung geprüft. Die alte Figur bleibt erhalten, erhält jedoch einen Hinweis und gesperrte Würfelaktionen. Änderungen am Hauptcharakter aktualisieren auch das geöffnete Begleiterfenster. Ein offener Attributdialog prüft vor dem Übernehmen erneut Figur, Zuordnung und Datenstand; zwischenzeitlich entfernte Figuren werden nicht weiter beschrieben. Auch Schadenswürfe prüfen nach der Auswertung erneut, ob der Begleiter noch gültig ist und die Figur noch gewürfelt werden darf, bevor die Nachricht gesendet wird.

In **Einstellungen → Favoriten ordnen** werden nicht mehr eindeutig auffindbare Proben als **Nicht verfügbar** gekennzeichnet. **Nicht verfügbare Favoriten entfernen** bereinigt nur den Einstellungsentwurf. Erst **Speichern** übernimmt die Änderung; **Abbrechen** lässt die bisherige Liste erhalten. Eine vorhandene, vorübergehend durch Zustände gesperrte Probe zählt weiter als verfügbar. Es werden keine Favoriten automatisch gelöscht.

Bestehende Makros und Daten benötigen keine Migration oder einen erneuten Charakterimport.

## Ruhigere Aktualisierungen in 1.9.9

Bei Aktualisierungen derselben Figur und Ansicht bleiben Listenposition, Suchfokus und Textmarkierung erhalten. Eine manuell zugeklappte Schnellleiste bleibt dabei geschlossen. Nach dem Ändern eines Favoriten kann die Tastaturbedienung an diesem Knopf weitergehen, ohne dass die Liste zum Anfang springt.

Ein unverändert vorhandener Würfelknopf kann seinen Fokus nach einer Aktualisierung behalten; die Wiederherstellung löst keinen Wurf aus. Ist an der alten Stelle eine andere Fähigkeit eingetragen, wird sie nicht als bisherige Probe behandelt. Stattdessen führt der Fokus zur Suche zurück. Geöffnete Dialoge und eine inzwischen bewusst gewählte andere Eingabe behalten ihren Fokus.

Die Wiederherstellung gilt nur für dieselbe Figur, denselben Bereich und denselben Suchtext. Die Merkhilfe gilt für die laufende Oberfläche und schreibt keine Charakterwerte oder zusätzlichen persönlichen Einstellungen. Kein erneuter Import erforderlich.

## Suche, Tastatur und Charakterwechsel in 1.9.8

Beim Wechsel über die Charakterauswahl sind weitere Aktionen gesperrt, bis die Ansicht zur gewählten Figur gehört. Auch bei einem Fehler der persönlichen Speicherung wird die neue Figur angezeigt; dafür erscheint eine Warnung. Eine alte Ansicht bleibt dadurch nicht mehr für eine intern bereits gewechselte Figur bedienbar.

Die Suche akzeptiert Umlaute auch als **ae/oe/ue** oder **a/o/u** sowie **ss** für **ß**. Mehrere Wörter müssen alle vorkommen, ihre Reihenfolge ist frei. Bei Begleitern kann die Suche Angaben aus der Überschrift und einer Probe kombinieren, etwa **Träger Hieb**. Namen und Quelldaten werden dabei nicht geändert.

Innerhalb des Modulfensters führt **Strg+F** zur Suche. **Pfeil runter** wechselt von dort zur ersten sichtbaren, freigegebenen normalen Würfelaktion. **Pfeil hoch/runter** bewegt sich zwischen den sichtbaren Proben; gesperrte Aktionen und eingeklappte Tabellen werden übersprungen. Vom ersten Treffer führt Pfeil hoch zurück zur Suche. **Esc** kehrt aus der Liste zur Suche zurück und leert beim nächsten Drücken das Suchfeld. Die Navigation selbst würfelt nicht; **Enter** oder **Leertaste** aktiviert erst den fokussierten Knopf. In geschlossenen Begleiterkarten bleiben deren sichtbare Schnellwürfe erreichbar.

Kein erneuter Import oder Datenumbau erforderlich.

## Begleiterwerte und Wiederholungsversuche in 1.9.7

Nach dem Speichern des Spielstands werden die verknüpften Begleiter einzeln aktualisiert. Scheitert einer davon, bleibt der gespeicherte Hauptcharakter erhalten und die übrigen Begleiter werden weiter abgeglichen. Die Warnung nennt den betroffenen Begleiter. Auch die Deaktivierung alter Proben eines nicht mehr enthaltenen Begleiters kann so erneut versucht werden; seine Figur und Bilder werden nicht gelöscht.

Zum Wiederholen den **Spielstand** erneut öffnen und **Speichern** wählen. Ohne geänderte Eingaben werden nur die Begleiter mit dem bereits gespeicherten Stand abgeglichen; der Hauptcharakter wird dabei nicht erneut geschrieben. **Abbrechen** bleibt ohne Änderungen. Ein inzwischen veränderter Stand oder verlorene Rechte erfordern erneutes Öffnen.

Ändert sich der Hauptcharakter während eines Abgleichs, wird er entfernt oder verliert der Benutzer seine Bearbeitungsrechte, stoppen weitere Übernahmen. Bereits abgeschlossene Änderungen werden nicht automatisch zurückgerollt. Der Fehler beim Speichern des Hauptcharakters selbst bleibt ein Fehler und startet keinen Begleiterabgleich. Die Änderungen benötigen keine Datenmigration und keinen erneuten Import.

## Import und Tokenbilder in 1.9.6

Ein bereits gespeicherter Import bleibt erfolgreich, wenn die persönliche Auswahl danach nicht gespeichert werden kann. Dafür erscheint eine Warnung. Die Figur bleibt ausgewählt und die eingelesene Dateiquelle bleibt für **Aktualisieren** verfügbar. Ein tatsächlicher Fehler beim Speichern der Charakterdaten bleibt ein Fehler.

Bildeditor und Importvergleich prüfen neben Originalbild und Ausschnitt auch das Tokenbild der Figur. Wird dieses zwischenzeitlich in Foundry geändert, überschreibt der alte Editor es nicht. Erfolgt die Änderung während der Aktualisierung verknüpfter Szenentokens, werden weitere alte Bildübernahmen gestoppt und gemeldet. Ein Import mit ausgeschalteter Bildübernahme übernimmt weiterhin die Charakterwerte und lässt vorhandene Bilder erhalten.

Die Änderungen benötigen keine Datenmigration und keinen erneuten Charakterimport. Bei einem Konflikt nach bereits gespeicherten Charakterwerten sind mehrere Foundry-Dokumente weiterhin kein gemeinsamer, atomarer Schreibvorgang.

## Würfe und persönliche Speicherung in 1.9.5

Ist eine Probe erfolgreich an das Würfelmodul übergeben worden, wird ein anschließender Fehler beim Speichern der persönlichen Liste als Warnung gemeldet. Die Probe wird dadurch nicht erneut ausgelöst; ihr nächster Modifikator bleibt verbraucht. Das gilt auch für Makros bei offenem oder geschlossenem Fenster. Ein tatsächlicher Fehler beim Senden der Probe bleibt ein Fehler und erhält den nächsten Modifikator für einen erneuten Versuch.

Eine nicht speicherbare persönliche Auswahl verhindert das Öffnen oder den Makrowurf nicht. Fehler beim Merken der Fensterposition blockieren weder den Wechsel zwischen Proben und Kampf noch das Schließen. Makros bei geschlossenem Fenster verwenden für Auswahlfenster und Klang das gespeicherte Design der tatsächlich gewürfelten Figur.

Ein offener Waffenset-Dialog prüft vor dem Speichern, ob die Figur und alle neu ausgewählten Waffen noch vorhanden und eindeutig sind. Eine reine Umordnung bleibt möglich. Alte Sets lassen sich auch dann entfernen, wenn die Figur inzwischen keine eigenen Waffen mehr besitzt.

## Rüstung und untrainierter NSC-Kampf in 1.9.4

**Dabei** und **Angelegt** prüfen vor dem Speichern, ob der angezeigte Rüstungseintrag noch zur aktuellen Liste passt. Bei einer zwischenzeitlich geänderten oder neu sortierten Liste wird die Aktion gestoppt und die aktuelle Ansicht geladen. Das schützt auch gleichnamige Rüstungen mit unterschiedlichen gespeicherten Kennungen. Unabhängig geänderte LE oder Fokus verhindern das Umschalten eines unveränderten Rüstungsteils nicht und bleiben erhalten.

NSC-Waffen ohne passende Kampftechnik verwenden entsprechend dem Generator **Talentwert 0**. Die Anzeige nennt dies **Ohne Kampftechnik**. Eigene Basiswerte, Fokus, Waffenmodifikatoren und Beeinträchtigung gelten weiterhin, auch bei verdeckten Proben und Fernkampf. Eine vorhandene Technik mit Wert 0 behält ihren Namen. Der Fall gilt für das eigenständige NSC-Format; unvollständige Kampfwerte normaler Charakterdateien bleiben prüfpflichtig.

## Begleiterdialoge und Sprache in 1.9.3

Energieänderungen eines verknüpften Begleiters prüfen vor dem Öffnen seine aktuelle eindeutige Zuordnung zum Hauptcharakter. Bei ersetzten Begleitern, fehlendem Hauptcharakter oder nicht mehr enthaltenem Wesen erscheint ein passender Hinweis. Ändert sich die Zuordnung oder gehen Bearbeitungsrechte während eines geöffneten Dialogs verloren, wird die Übernahme gestoppt. **Abbrechen** bleibt ohne Übernahme möglich. Eine reine Änderung des Tokenrahmens unterbricht einen ansonsten gültigen Energiedialog nicht. Bestehende Actors und Bilder bleiben erhalten.

Die ausdrücklich gewählte Sprache gilt jetzt auch für Import-, Attributsauswahl- und Bilddialoge unabhängig vom Design: normale Sprache im Ork-Design und Ork-Sprache in anderen Designs funktionieren entsprechend der Einstellung. Äußere Leerzeichen im Begleiternamen verhindern den Direktwurf auch nach der Attributsauswahl nicht mehr. Originalname, Kennung und gespeicherte Probenwerte bleiben erhalten.

## Mehrere Fenster und verzögertes Speichern in 1.9.2

Mehrere Modulfenster im selben Browser speichern persönliche Änderungen nacheinander und übernehmen nur die tatsächlich bearbeiteten Einstellungen. Unabhängig ergänzte Favoriten und Notizen bleiben erhalten; andernorts entfernte Favoriten werden nicht durch einen älteren Fensterstand zurückgebracht. Favoriten lassen sich weiterhin gezielt ordnen. Gleichzeitig unterschiedlich bearbeitete Waffenset-Listen werden vor dem Überschreiben abgewiesen; den Dialog dann erneut öffnen. Eine fehlgeschlagene Speicherung blockiert spätere Versuche nicht.

Ein verzögert gespeichertes Figurendesign gehört weiterhin zur ursprünglich gewählten Figur, auch wenn inzwischen eine andere ausgewählt wurde. Wiederholtes Neuzeichnen derselben Oberfläche vervielfacht die Such-Tastaturaktionen nicht mehr. Beim Charakterimport wird unmittelbar vor der Bildübernahme geprüft, ob Portrait oder Ausschnitt zwischenzeitlich geändert wurden. Verlorene Bearbeitungsrechte stoppen den Import vor dem nächsten Charakterschreibschritt. Bereits geschriebene Charakterdaten werden bei einem späteren Bildkonflikt nicht automatisch zurückgerollt.

Die Abstimmung der persönlichen Speicheraktionen gilt für Fenster derselben Browser-Sitzung. Sie ist keine weltweite Sperre über mehrere Browser oder Foundry-Dokumente. An Quelldateien oder Würfelregeln ändert sich nichts.

## Fehlerkorrekturen in 1.9.1

- Geweihte Begleiter zeigen KE auch im eigenen Token-Eintrag und als einzeln importiertes Wesen. Der Importvergleich berücksichtigt Änderungen ihrer Karmaenergie.
- NSC-Nahkampfschaden enthält den vom Generator vorgesehenen TP/KK-Bonus einschließlich Finesse. Gefolge aus dem NSC-Generator behält gespeicherte Reaktion, Angriffsschaden, Reichweite und Hinweise. Regeltexte und Notizen werden der richtigen NSC-Fähigkeit, dem Merkmal oder der Kraft zugeordnet, auch bei gleichen Namen.
- Favoriten können aus der Schnellleiste auf die Makroleiste gezogen werden. Pfeil-ab aus der Suche fokussiert auch bei geschlossenen Begleitern einen sichtbaren Würfelknopf. Äußere Leerzeichen im Begleiter- oder Fähigkeitsnamen verhindern keine Direktwürfe mehr; Originalnamen und Kennungen bleiben erhalten.
- Bild- und Tokenaktualisierungen erkennen zwischenzeitliche Änderungen am Portrait oder Ausschnitt. Ein Begleiterimport stoppt bei geändertem Hauptcharakter oder verlorenen Besitzerrechten vor dem nächsten Schreibschritt. Bereits erfolgte Schreibvorgänge an anderen Foundry-Dokumenten werden nicht automatisch zurückgerollt.

Für die ergänzten NSC- und KE-Werte bestehende Charaktere beziehungsweise Gefolgsdateien einmal über **Aktualisieren** oder **JSON importieren** erneut einlesen. Eigene Energie- und Zustandsänderungen können dabei wie bisher zum Behalten gewählt werden. Die Quelldateien werden nicht verändert.

## Begleiter und Aktualisierung ab 1.9.0

Im Kampfbereich öffnet ein Klick auf die **LE eines Begleiters** direkt dessen Energien. **Plus und Minus** ändern zunächst den Entwurf; erst **Speichern** übernimmt die Werte. **Abbrechen** verwirft den Entwurf. **Quelldaten verwenden** setzt dort ausschließlich die Energien dieses Begleiters zurück. Dafür werden Besitzerrechte am Hauptcharakter benötigt.

Bei mehreren Begleitern klappen zwei kleine Pfeilknöpfe alle Abschnitte auf oder zu. Beim gemeinsamen Zuklappen wird eine laufende Suche geleert, damit deren Treffer die Abschnitte nicht sofort wieder öffnen. Die nächste Erschwernis bleibt erhalten.

Der Foundry-Spielstand speichert nur Abweichungen zur importierten Quelle: Wer nur LE ändert, hält beim nächsten Import keine unveränderten AE oder andere Begleiterwerte fest. Bei Zuständen werden Stufe, Aktivierung und Unterdrückung getrennt behandelt. Eine lokal geänderte Unterdrückung hält daher keine unveränderte Zustandsstufe fest. Neue Zustände aus der aktualisierten Datei bleiben erhalten. Vollständige Spielstände aus 1.8.0 werden beim nächsten Speichern oder Behalten entsprechend reduziert; das bloße Öffnen oder unveränderte Speichern eines Dialogs schreibt keine neuen Charakterdaten. Die bisherigen Importauswahlen zum Behalten gelten weiterhin.

Die Begleiterauswertung verwendet einen Zwischenspeicher je importiertem Datenstand. Suche und Gruppensichtbarkeit vermeiden wiederholte Durchläufe durch dieselben Zeilen. Das ändert weder Probenwerte noch die Quelldatei, Bilder oder Token-Zuordnungen.

## Spielkomfort ab 1.8.0

**Spielstand** öffnet die in Foundry veränderbaren Zustände und Energien. Bei normalen Pedipalpus-Charakteren können gespeicherte einfache und abgestufte Zustände einschließlich Unterdrückung geändert werden. Die bekannten automatischen Auswirkungen werden neu berechnet. Andere situationsabhängige Auswirkungen bleiben manuell. NSCs und reine Gefolgsdateien übernehmen eigene Energien, ohne die Zustandsregeln des Hauptcharakters aufzuzwingen. Verknüpfte Begleiter bearbeiten ihre Energien über den Hauptcharakter; dafür sind dort Besitzerrechte erforderlich. **Quelldaten verwenden** setzt beim Hauptcharakter dessen lokale Änderungen zurück, bei einem separat geöffneten Begleiter ausschließlich dessen lokale Energien.

Die importierte JSON bleibt unverändert. Beim erneuten Import werden lokale Zustände, LE/AE/KE und die gewählte Nebenhand getrennt zum Behalten angeboten. Ohne Haken gelten die Werte der neuen Datei. Begleiter werden nach eindeutiger Kennung zugeordnet; fehlende oder mehrdeutige Wesen erhalten keine fremden Werte. Nicht zuordenbare lokale Energieeinträge bleiben beim Behalten gespeichert und können erst bei wieder eindeutiger Zuordnung wirken. Bilder und Token-Zuordnungen folgen weiterhin den separaten Importoptionen. Zwischenzeitlich erkannte Änderungen stoppen veraltete Dialoge vor dem Speichern; es gibt keine globale Mehrbenutzersperre. Das Austauschpaket enthält weiterhin die Quelldatei mit den bisherigen Fokus-/Rüstungsanpassungen, nicht den zusätzlichen Foundry-Spielstand.

Geschlossene Begleiter zeigen ihr Tokenbild, LE und bis zu zwei Schnellaktionen. Die ersten beiden persönlichen Kampffavoriten dieses Wesens bestimmen die Auswahl. Ohne Favoriten erscheinen ein Angriff und eine allgemeine Fähigkeit beziehungsweise Parade. Die Schnellaktion würfelt normal, ohne den Abschnitt aufzuklappen; alle normalen und verdeckten Proben bleiben im geöffneten Abschnitt verfügbar.

**Schaden** steht als Formel beim Waffenblock. Der Formelknopf würfelt normal im aktuellen Foundry-Chatmodus, das zweite Symbol verdeckt für die Spielleitung. Diese Würfe verbrauchen keine nächste Erschwernis und ziehen keine LE ab. Unterstützt werden eindeutige Summen aus normalen Würfeln und festen Zahlen; unbekannte Ausdrücke bleiben sichtbar, sind aber nicht würfelbar. Gespeicherte Schadensboni werden nicht erneut addiert. Die Ausgabe verwendet Foundrys [Roll.toMessage](https://foundryvtt.com/api/classes/foundry.dice.Roll.html#toMessage) mit dem V14-Sichtbarkeitsmodus.

**Waffensets** speichern persönlich bis zu zwölf benannte Auswahlen je Figur. Beim Wechsel wird nur die eigene Waffenliste gefiltert; Gefolge bleibt sichtbar. Optional wird die in Pedipalpus unterstützte aktive Nebenhand gewählt und in Foundry gespeichert. Fehlende oder mehrdeutige Waffen setzen die Anzeige auf alle Waffen zurück und werden benannt. Der Wechsel zurück zu **Alle Waffen** hebt den Listenfilter auf und verändert die Nebenhand nicht. Setwahl ist keine automatische Ausrüstungs-, Handlungs- oder Tickverwaltung.

Beim Import können **Begleiterbilder gesammelt** ausgewählt werden. Eindeutige gespeicherte Bilddateinamen oder exakte Begleiternamen als Dateiname werden zugeordnet; zusätzlich gibt es eine einzelne Bildauswahl pro Begleiter. Bildauswahl wählt einen neuen Token-Eintrag vor, sofern kein bestehendes Ziel ausgewählt ist. Ziele bleiben sichtbar änderbar. Alle gewählten Bilder werden geprüft und mit dem gewählten Rahmen vorbereitet, bevor Charakterdaten geschrieben werden. Ein Bild ohne Token-Ziel wird abgewiesen. Ohne Bilder-/Begleiterübernahme werden die jeweiligen Bilddateien nicht verarbeitet. Neue Token-Einträge anschließend aus dem Charakterverzeichnis auf die Karte ziehen.

Unter **Einstellungen** stehen Schriftgröße90–130Prozent, kräftigere Werte und ruhige Zeilenflächen. **Design für diese Figur merken** speichert das aktuelle Design persönlich für diese Figur; weitere Designwechsel betreffen dann diese Figur. Ohne diese Wahl gilt die allgemeine persönliche Darstellung. Die Auswahl anderer Spieler wird nicht verändert.

Das kleine **Informationssymbol** an einer Probe öffnet verfügbare Beschreibungen, Kosten, Dauer oder Reichweite aus den tatsächlich enthaltenen Quelldaten sowie eine eigene Spielnotiz. Fehlende Angaben werden nicht ergänzt. Notizen sind persönlich pro Figur und eindeutig zuordenbarer Probe gespeichert; sie verändern weder die Quelldatei noch die Notizen anderer Spieler. Gleiche Namen werden bei Mehrdeutigkeit nicht automatisch zusammengeführt.

## Aktuelle Pedipalpus-Dateien

Version 1.7.0 unterstützt zusätzlich die am 26. Oktober 2026 vorliegenden Charakterdateien ohne gespeicherte Attributsummen. Attribute werden aus Grundwert und Modifikator aufgebaut; bereits enthaltene Regelboni werden nicht nochmals addiert. Alte Charakterdateien, NSC-Format und Gefolgsdateien bleiben unterstützt.

Bei diesen neuen Charakterdateien werden gespeicherte Zustände einschließlich ganzer oder teilweiser Unterdrückung berücksichtigt: vorübergehende Attributsänderungen, Reaktion, Probenabzüge und die von Pedipalpus vorgesehenen Handlungssperren. Eisern und Ausdauernd reduzieren jeweils eine passende Zustandsstufe; Blutrausch ignoriert Schmerz und sperrt defensive Proben. Theoretiker und Schlechte Gelenke folgen ebenfalls den neuen Probenregeln. Zustände stehen kompakt über der Liste; gesperrte Proben bleiben sichtbar und können auch über Makros nicht ausgelöst werden. Die Werte enthalten diese Abzüge bereits. Situationsabhängige Ausnahmen bleiben manuell. Zustände werden beim Import übernommen, nicht während des Spiels mit der Windows-App synchronisiert.

Eine in Pedipalpus ausgewählte, selbst getragene einhändige Nebenhand erhöht nur geeignete einhändige Hauptwaffen-Paraden. Ihre Ausbildungsstufe bestimmt den Schild-/Parierbonus. Beim Ändern getragener oder angelegter Rüstungen bleibt Rüstungsgewöhnung berücksichtigt; Überlastung wird dadurch nicht vermindert. Gefolgsmitglieder erhalten keine Zustandsabzüge oder Fokusboni ihres Besitzers. Personenbegleiter übernehmen zusätzlich göttliche Fähigkeiten sowie eigene Ausweichen- und Wahrnehmungsproben. Waffen, die einer Person zugewiesen sind, erscheinen mit deren gespeicherten fertigen Angriffen im Gefolgsabschnitt.

Nach einem Modulupdate den Charakter einmal über **Aktualisieren** oder **JSON importieren** erneut einlesen. Die Quelle muss zuvor in der aktuellen Pedipalpus-App gespeichert worden sein. Bilder, vorhandene Begleiter-Zuordnungen und persönliche Favoriten folgen den bisherigen Importoptionen. Der Regelabgleich, die Charaktererstellung, Steigerungen und Regeneration bleiben Funktionen der Windows-App; das Foundry-Modul verändert keine AP oder lokalen Charakterdateien.

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

Das Austauschpaket enthält bei NSC eine `npc.nsc.json` im ursprünglichen Format, mit aktuellen NSC-Rüstungszuständen und Fokus; die übrigen Originaldaten bleiben erhalten. Ein vorhandenes Portrait wird separat beigefügt, ohne fremde Portrait- oder Charakterfelder in die NSC-JSON einzutragen. Die Windows-Datei bleibt unberührt. Unterstützt ist Formatversion 1 bis 5 MB; fremde, gemischte und unbekannte zukünftige Formate werden zurückgewiesen. Es gibt keine automatische Generierung oder Steigerung im Foundry-Modul. Aktuelle Energien können über Spielstand geändert werden; Regeneration und Verbrauch werden nicht automatisch abgewickelt.

## Kompakte Oberfläche

Das Fenster startet mit 540 × 520 Pixeln und kann vergrößert werden. Die Probenliste scrollt im Fenster. Angezeigt werden nur vollständig definierte Attributs-, Widerstands-, Reaktions-, Fertigkeits-, Freizeit-, Zauber-, Ritual- und Wunderproben. Bereiche ohne Proben werden ausgeblendet. Die Suche durchsucht alle Bereiche. Fantasy mit Holzrahmen und Pergament ist der Standard für neue Benutzer. Dunkel, Hell, Ork, Dämonisch, Aristocrat, Krieger, Magie und Alchemy bleiben auswählbar. Die zuletzt gewählte Darstellung wird pro Foundry-Benutzer in der Welt gespeichert und beim nächsten Öffnen sowie auf anderen Geräten wieder verwendet. Beim ersten Öffnen nach dem Update wird die bisherige Browserauswahl einmalig für diesen Benutzer übernommen; andere Benutzer erhalten Fantasy, bis sie selbst eine Darstellung auswählen.

Biografie, vollständiges Inventar, AP-Anzeigen und allgemeine Charakterbearbeitung bleiben in Pedipalpus. Zustände und aktuelle Energien sind über den kleinen Spielstand-Dialog erreichbar. Kampf- und Gefolgsproben sind ausschließlich im **Kampfbrett** über das gekreuzte Waffensymbol erreichbar. Sie erscheinen weder in der normalen Probenliste noch im Probenring. Der Fokusregler gehört ebenfalls zum Kampfbrett.

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

## Gefolge einzeln oder als Bibliothek importieren

**Werkzeuge → JSON importieren → Gefolge importieren** nimmt vorbereitete Dateien im Format `Pedipalpus.Gefolge`, Version1, an. Ein einzelnes Wesen wird direkt als eigener Foundry-Eintrag mit seinen endgültigen Werten geöffnet. Bibliotheken enthalten mehrere Wesen in getrennten aufklappbaren Abschnitten; beim Import lassen sich zusätzliche Token-Einträge für ausgewählte Mitglieder anlegen und einem Spieler zuweisen. Hauptcharakter-/NSC-Dateien dürfen eine solche Bibliothek nicht überschreiben und umgekehrt. Vorbereitete JSONs können zusammen mit einem passenden Portrait als einzelnes ZIP importiert werden.

Eine Gefolgsdatei enthält `Format`, `Version`, `Name` und mindestens eine der Listen `Animals`, `Demons`, `Undead`, `Chimeras`, `Persons`, `Elementals` oder `Golems`. Jedes Wesen benötigt `Name`, eine eindeutige `InventoryId` und die acht endgültigen Werte `MU`, `KL`, `IN`, `CH`, `FF`, `GE`, `KO`, `KK`. Angriffe und Fähigkeiten verwenden dieselben Datenfelder wie das gespeicherte Pedipalpus-Gefolge. Eine optionale Angabe `AttackOnly: true` unterdrückt einen nicht angegebenen Paradewurf für einen zusätzlichen Angriff. Dies ist ein eigenständiges Austauschformat für das Foundry-Modul, keine Windows-Charakterdatei.

**Spielwerte und Regeln** zeigt bei jedem Begleiter vorhandene Angaben zu RS, gMR/kMR, Reaktion, Geschwindigkeit, Bindungslast, Beschwörung, Tragkraft, Angriffsschaden, Material und Besonderheiten. Reaktion wird mit MU/IN/GE und dem gespeicherten Probenwert gewürfelt. Breite Fähigkeiten ohne festgelegte Attributskombination bleiben beim Würfeln auswählbar. Fehlende Zahlenwerte werden nicht ergänzt. Passive Effekte, Schadenswürfe, Ressourcenverbrauch, Manöver und bedingte Boni aus Regeltexten werden nicht automatisch abgewickelt.

Regelbücher, Charakterdateien und private Importbibliotheken sind nicht Bestandteil des öffentlichen Moduldownloads.

## Entwicklungsprüfungen

Die Tests benötigen Node.js mit Unterstützung für `node --test`, `File` und `DecompressionStream`. Die Integrationstests verwenden unveränderte Dateien aus Ucurifunke – Proben. Sie werden getrennt vom Modul bereitgestellt und vor dem Testlauf relativ zum Repository abgelegt:

- `../pedipalpus-checks/ucurifunke-v1.0.8/ucurifunke-checks/scripts/ucurifunke-checks.js` · SHA-256 `8580ccbce9844536907e7f3db4250d7b4df54d0f808a01088071013a384a0b71`
- `../pedipalpus-checks/ucurifunke-v1.0.14/scripts/ucurifunke-checks.js` · SHA-256 `a9e41cb7fdd6521a07f3b7c43cec101274f0b42389a62dc4db2656c837f30410`

Danach im Repository `npm test` ausführen. Oberflächenprüfungen unter `tools/*-browser-check.mjs` benötigen zusätzlich Playwright und Chrome; die Pfade lassen sich über `PEDIPALPUS_PLAYWRIGHT` und `PEDIPALPUS_BROWSER` angeben. Private Charakter- und Gefolgsprüfungen sind optional und verwenden ausschließlich ausdrücklich gesetzte lokale Dateipfade. Testquellen und private Dateien werden nicht in das Modulpaket aufgenommen.
