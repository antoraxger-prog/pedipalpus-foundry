const names = {
  'Athletik':'Körper stark', 'Dauerbelastung':'Lange durchhalten', 'Kraftakt':'Schweres heben', 'Reflexe':'Schnell reagieren',
  'Heimlichkeit':'Keiner sieht', 'Schleichen':'Leise gehen', 'Taschendiebstahl':'Tasche leer machen', 'Verstecken und Tarnen':'Nicht da. Nicht sehen.',
  'Körperbeherrschung':'Körper hört zu', 'Akrobatik':'Springen. Nicht fallen.', 'Balanceakte':'Stehen bleiben', 'Rhythmische Bewegung':'Körper wackeln',
  'Stimmorgan':'Mund laut machen', 'Stimmen imitieren':'Wie anderer reden', 'Singen':'Mund Musik machen', 'Tierrufe':'Wie Tier rufen',
  'Bräuche und Sitten':'So machen Leute', 'Etikette':'Fein benehmen', 'Rechtskunde':'Was Boss erlaubt', 'Völkerkunde':'Andere Leute kennen',
  'Leute und Persönlichkeiten':'Wichtige Leute kennen', 'Adel und Wohlhabende':'Reiche Leute kennen', 'Fachleute':'Könner kennen', 'Verbrecher und Schurken':'Fiese Leute kennen',
  'Menschenkenntnis':'Leute durchschauen', 'Einschätzen':'Was der wohl kann', 'Seelsorge':'Kopf wieder gut', 'Unwahrheit erkennen':'Der lügt!',
  'Rhetorik':'Gut reden', 'Betören und Schmeicheln':'Nett reden. Kriegen.', 'Reden halten':'Alle hören mir zu', 'Überzeugen':'Du machst das jetzt',
  'Stadtleben':'Häuserland kennen', 'Beschatten':'Hinterher. Heimlich.', 'Ortskenntnis':'Hier kenne ich', 'Sich umhören':'Leute fragen',
  'Überreden':'Mund gewinnt', 'Drohen und Einschüchtern':'Angst machen', 'Feilschen und Verhandeln':'Weniger Münzen geben', 'Lügen und Manipulation':'Quatsch reden. Glauben.',
  'Festsetzen':'Du bleibst hier', 'Fallen stellen':'Falle bauen', 'Fesseln/Entfessln':'Festbinden. Losmachen.', 'Fesseln/Entfesseln':'Festbinden. Losmachen.', 'Seiler und Netzknüpfer':'Seil und Netz machen',
  'Orientieren':'Weg finden', 'Gassen und Straßen':'Weg zwischen Häusern', 'Natur':'Weg im Grünen', 'Nautik':'Weg auf Wasser',
  'Pflanzenkunde':'Grünzeug kennen', 'Ackerbau':'Essen wachsen lassen', 'Botanik':'Grünzeug wissen', 'Nahrung sammeln':'Essen finden',
  'Tierkunde':'Viecher kennen', 'Abrichten und Tierempathie':'Tier macht was ich will', 'Tiermedizin':'Tier wieder gesund', 'Zoologie':'Viecher wissen',
  'Überleben':'Nicht sterben', 'Fährten suchen':'Fußspuren finden', 'Lagern':'Schlafplatz machen', 'Wettervorhersage':'Kommt Regen?',
  'Derekunde':'Welt kennen', 'Geographie':'Welt wissen', 'Geschichtswissen':'Früher wissen', 'Sprachenkunde':'Andere Worte kennen',
  'Götter und Kulte':'Große Bosse oben', 'Doktrin und Lehrmeinung':'Was Tempel sagt', 'Karmales Wirken':'Gott macht Sachen', 'Sekten und Kulte':'Komische Betleute',
  'Heraldik':'Zeichen kennen', 'Adel und Nationen':'Bosszeichen kennen', 'Handwerkszeichen':'Arbeitszeichen kennen', 'Institutionen':'Hauszeichen kennen',
  'Kosmos':'Himmel und mehr', 'Gestirne und Konstellationen':'Sterne kennen', 'Kraftlinien- und Knoten':'Zauberwege kennen', 'Sphären und Limbus':'Andere Welten kennen',
  'Kriegskunst':'Viele Leute hauen', 'Logistik':'Zeug dahin bringen', 'Strategie':'Großen Kampf planen', 'Taktik':'Hier richtig hauen',
  'Magiekunde':'Zauber kennen', 'Magische Entitäten':'Zauberviecher kennen', 'Traditionen':'So zaubern Leute', 'Zauber und Rituale':'Zauberdinge kennen',
  'Mathematik':'Zahlen machen', 'Buchführung':'Münzen aufschreiben', 'Kryptographie':'Geheimschrift lesen', 'Rechnen':'Zahlen zusammen',
  'Sagen und Legenden':'Alte Geschichten', 'Volksglaube und Märchen':'Leute erzählen Sachen', 'Epos und Heldenlied':'Großer Held. Geschichte.', 'Orte und Wunderdinge':'Seltsame Orte und Zeug',
  'Verwaltung':'Zeug ordnen', 'Hauswirtschaft':'Haus in Ordnung', 'Staatskunst':'Land als Boss führen', 'Unternehmen':'Geschäft führen',
  'Alchemie':'Trankzeug machen', 'Alchimie':'Trankzeug machen', 'Laboranalyse':'Was im Trank?', 'Alchemika herstellen':'Zaubertrank brauen', 'Transmutation und Veredelung':'Zeug anders machen',
  'Alkoholherstellung':'Saufzeug machen', 'Brauer':'Bier machen', 'Schnaps brennen':'Starkes Saufzeug', 'Winzer':'Traubensaufzeug',
  'Baukunst':'Großes bauen', 'Architektur':'Haus planen', 'Bergbau':'Berg aufgraben', 'Dämme und Wälle':'Große Mauer machen',
  'Gefährte lenken':'Ding fährt dahin', 'Boote und Schiffe':'Wasserding lenken', 'Karren und Kutschen':'Räderding lenken', 'Schlitten':'Schneeding lenken',
  'Heilkunde':'Aua weg machen', 'Gifte':'Fieses Zeug kennen', 'Krankheiten':'Krank weg machen', 'Verletzungen':'Wunde zu machen',
  'Holzverarbeitung':'Holz machen', 'Schreinern und Schnitzen':'Holz formen', 'Waffen fertigen':'Hauzeug bauen', 'Zimmermann':'Holzhaus bauen',
  'Juwelenkunde':'Glitzersteine kennen', 'Gemmologie':'Glitzerstein wissen', 'Kristallzucht':'Glitzer wachsen lassen', 'Steinschleifer':'Glitzerstein glatt',
  'Kunst':'Schöne Sachen machen', 'Kalligraphie':'Schöne Schrift', 'Kunstgeschichte':'Alte schöne Sachen', 'Malen und Zeichnen':'Bild machen',
  'Metalle':'Hartes Zeug kennen', 'Hüttenkunde':'Hartes Zeug schmelzen', 'Metallurgie':'Hartes Zeug mischen', 'Verarbeitung':'Hartes Zeug formen',
  'Musizieren':'Musik machen', 'Dirigieren':'Musikleute führen', 'Instrumente spielen':'Musikding spielen', 'Komponieren':'Neue Musik ausdenken',
  'Steinbearbeitung':'Stein machen', 'Gesteinskunde':'Steine kennen', 'Maurer':'Steine aufeinander', 'Steinmetz':'Stein hauen',
  'Technik':'Dinge funktionieren', 'Apparaturen bedienen':'Ding anmachen', '(Fein)Mechanik':'Kleines Ding bauen', 'Schlösser knacken':'Zu wird offen',
  'Tierverarbeitung':'Totes Tier nutzen', 'Fleischer':'Fleisch machen', 'Gerber/Kürschner':'Haut und Fell machen', 'Lederarbeiten':'Lederzeug machen',
  'Textilien':'Stoffzeug machen', 'Schneidern und Knüpfen':'Klamotten machen', 'Spinnen und Weben':'Faden und Stoff machen', 'Stoffe färben':'Stoff bunt machen',
  'Äxte und Beile':'Axt hauen', 'Dolche':'Klein spitz stechen', 'Fechtwaffen':'Fein stechen', 'Hämmer':'Hammer hauen',
  'Knüppel und Kolben':'Knüppel hauen', 'Morgensterne und Flegel':'Stachelding schwingen', 'Handgemenge':'Faust ins Gesicht', 'Säbel':'Krummes Hauzeug',
  'Stangenwaffen':'Langes Hauzeug', 'Schwerter':'Schwert hauen', 'Speere und Lanzen':'Lang spitz stechen', 'Armbrüste':'Ding spannt. Schießt.',
  'Blasrohre':'Rohr pusten', 'Bögen':'Bogen schießen', 'Schleudern':'Stein fliegt', 'Scheiben und Diskus':'Rundes Ding werfen',
  'Torsionswaffen':'Großes Ding schießt', 'Wurfbeile':'Axt werfen', 'Wurfmesser':'Messer werfen', 'Wurfspeere':'Speer werfen',
  'Sternkunde':'Sterne kennen', 'Brettspiele':'Brett spielen', 'Kartenspiele':'Karten spielen', 'Reiten':'Auf Tier sitzen', 'Schwimmen':'Im Wasser bleiben',
  'Ignifaxius Flammenstrahl':'Feuer spucken', 'Ignisphaero Feuerball':'Feuerball werfen', 'Balsam Salabunde':'Zauber macht gesund',
  'Armatrutz Eisenhaut':'Haut wird hart', 'Flim Flam Funkel':'Licht machen', 'Somigravis Tiefer Schlaf':'Du schläfst jetzt',
  'Wundsegen':'Gott macht Aua weg', 'Heilungssegen':'Gott macht gesund', 'Schutzsegen':'Gott passt auf'
};
const labels = new Map(Object.entries(names).map(([name,label])=>[name.normalize('NFC').toLocaleLowerCase('de'),label]));

export function orkTalentName(name) {
  const original = String(name ?? '').trim();
  if (!original) return 'Ding können';
  const key = original.normalize('NFC').toLocaleLowerCase('de');
  return labels.get(key) || 'Extra Ding können';
}

export function checkDisplayName(check, language) {
  return language === 'ork' && check?.kind === 'skill' ? orkTalentName(check.name) : check?.name || '';
}
