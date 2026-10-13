const words = {
  'Pedipalpus – Proben':'Pedipalpus – Unga würfeln',
  'Charakter':'Du', 'Foundry-Charakter':'Du wählen', 'Charakter auswählen …':'Wer du? Wählen.',
  ' · noch kein Import':' · Blatt fehlt', 'JSON importieren':'Blatt holen',
  'Charakterbild importieren':'Gesicht holen', 'Charakter- und Tokenbild importieren':'Gesicht für du und Figur holen',
  'Darstellung':'Aussehen', 'Fantasy':'Fantasy', 'Dunkel':'Nacht', 'Hell':'Tag', 'Ork':'Ork',
  'Charakterdatei importieren, eine Probe auswählen und würfeln.':'Blatt holen. Ding wählen. Würfel werfen. Unga!',
  'Einen vorhandenen Foundry-Charakter auswählen oder beim Import einen neuen anlegen.':'Du schon da? Wählen. Du neu? Blatt holen.',
  'Bereich':'Was tun?', 'Probenbereich':'Was du tun?', 'Suche':'Ding suchen',
  'Probe suchen …':'Wo Ding?', 'Fertigkeiten durchsuchen':'Dein Können suchen',
  'Suche in allen Bereichen':'Unga sucht überall.', 'Nächste Probe':'Nächster Wurf',
  'Erschwernis':'Schwer. Aua.', 'Erleichterung':'Leicht. Gut.',
  'Gilt für die nächste Probe, danach wieder 0':'Ein Wurf. Dann wieder null.',
  'Zwischen Erschwernis und Erleichterung wechseln':'Klicken. Schwer oder leicht.',
  '↑ schwerer':'↑ mehr aua', '↓ leichter':'↓ weniger aua', 'Mausrad':'Mausrad',
  'Fokus':'Kampf-Laune', 'Kampffokus':'Hauen oder abwehren', 'OFF':'Hau', 'DEF':'Block',
  'Nahkampffokus wird im Foundry-Charakter gespeichert. Ein erneuter JSON-Import übernimmt wieder den Fokus aus Pedipalpus.':'Hau mehr? Block weniger. Bleibt bei du. Neues Blatt bringt alte Laune.',
  'Probe':'Ding', 'Attribute':'Du-Werte', 'Wert':'Zahl', 'Würfeln':'Würfel werfen',
  'Talent':'Können', 'Talentwert':'Können-Zahl', 'Probenwert':'Wurf-Zahl',
  'Fertigkeit':'Können', 'Basis':'Grund', 'Fokuswert':'Laune', 'Waffenbonus':'Waffe hilft',
  'würfeln':'würfeln. Unga!', 'verdeckt ':'heimlich ',
  'verdeckt würfeln – Ergebnis nur für Spielleiter':'heimlich würfeln. Nur Meister guckt.',
  'Zum Würfeln werden Besitzerrechte benötigt.':'Du darfst nur mit deinem Blatt würfeln. Meister fragen.',
  'Kampfproben benötigen Ucurifunke – Proben ab 1.0.14.':'Hauen braucht Ucurifunke ab 1.0.14. Meister holen.',
  'Keine passende Probe gefunden.':'Ding nicht da. Anders suchen.',
  'Für Kampf- und Tierproben die Charakterdatei erneut importieren.':'Hauen und Tier? Blatt nochmal holen.',
  'Talente:':'Können:', '0 ungeübt':'0 nix können', '1–3 Grundlagen':'1–3 bisschen',
  '4–6 geübt':'4–6 gut', '7–9 versiert':'7–9 stark', '✦ 10+ meisterlich':'✦ 10+ Oberboss',
  'Attribute:':'Du-Werte:', '1 sehr schwach':'1 ganz schlapp', '10 durchschnittlich':'10 geht so', '✦ 20+ meisterlich':'✦ 20+ Oberboss',
  'Besitzerzugriff':'Dein Blatt. Du darfst.', 'Lesezugriff':'Nur gucken.', 'Token:':'Figur:', 'Sprecher:':'Du sagt:',
  'Ausgewählten Token verknüpfen':'Figur mit Blatt verbinden',
  'Werte in Pedipalpus ändern und die JSON-Datei erneut importieren.':'Zahlen ändern? In Pedipalpus machen. Dann Blatt nochmal holen.',
  'Alle Proben':'Alles tun', 'Kampf':'Hauen', 'Tierproben':'Tier tun', 'Körperlich':'Körper tun',
  'Sozial':'Mit Leuten reden', 'Natur':'Draußen tun', 'Akademisch':'Kopf tun', 'Handwerklich':'Dinge bauen',
  'Freizeit':'Spaß tun', 'Magie':'Zauber tun', 'Klerikal':'Götter tun',
  'Sehr schwach':'Ganz schlapp', 'Schwach':'Schlapp', 'Durchschnittlich':'Geht so', 'Stark':'Stark!',
  'Meisterlich':'Oberboss!', 'Ungeübt':'Nix können', 'Grundkenntnisse':'Bisschen können', 'Geübt':'Gut können', 'Versiert':'Viel können',
  'Kampfwert':'Hau-Zahl', 'Basiswert':'Grund-Zahl',
  'Angriff':'Hau!', 'Parade':'Block!', 'Fernkampf':'Weit hau!', 'Widerstände & Reaktion':'Nicht umfallen. Schnell sein.',
  'Zauber':'Zauber tun', 'Rituale':'Lange zaubern', 'Wunder':'Götter helfen',
  'Pedipalpus-Charakter importieren':'Dein Blatt holen', 'Importieren':'Holen', 'Abbrechen':'Nö',
  'Ja':'Jo. Machen.', 'Nein':'Nö.',
  'Pedipalpus-Charakterdatei':'Dein Blatt (JSON)', 'Bitte eine JSON-Datei auswählen.':'JSON-Blatt wählen. Unga warten.',
  'In Foundry speichern als':'Blatt gehört wem?', 'Neuen Charakter anlegen':'Neuen du machen',
  'Optional ein Charakterbild auswählen.':'Gesicht da? Kannst holen.', 'Charakterbild (optional)':'Gesicht. Wenn du wollen.',
  'Kein Bild ausgewählt. Vorhandene Foundry-Bilder bleiben erhalten.':'Kein neues Gesicht. Altes bleibt.',
  'Beim Import werden die Pedipalpus-Daten ersetzt. Mit Bildauswahl werden Charakterbild, Token-Vorlage und bearbeitbare verknüpfte Tokens aktualisiert. Berechtigungen und übrige Foundry-Werte bleiben erhalten.':'Neues Blatt ersetzt altes Blatt. Neues Gesicht kommt auf du und deine verbundenen Figuren. Andere Sachen bleiben.',
  'Bitte zuerst eine gültige Charakterdatei auswählen.':'Erst gutes Blatt wählen. Dann holen.',
  'Bitte ein gültiges Bild auswählen oder die Bildauswahl leeren.':'Bild kaputt? Gutes Bild nehmen. Oder kein Bild.',
  'Datei wird gelesen …':'Unga liest Blatt …', 'Proben':'Dinge', 'Dateiversion':'Blatt-Version',
  'Bilddatei':'Gesicht-Datei', 'Bild übernehmen':'Gesicht nehmen',
  'Bild bis 10 MB auswählen. Das Bild wird für Charakter, Token-Vorlage und bearbeitbare verknüpfte Tokens übernommen.':'Gesicht bis 10 MB. Kommt auf du und deine verbundenen Figuren.',
  'Charakter- und Tokenbild übernommen.':'Du und Figur haben Gesicht. Schön.',
  'Gemeinsames Charakterblatt verwenden':'Figur kriegt dein Blatt',
  'Dieser Token verwendet bisher ein eigenes Blatt. Nach dem Verknüpfen verwendet er die gemeinsamen Werte des gewählten Foundry-Charakters. Verknüpfen?':'Figur hat eigenes Blatt. Verbinden macht dein Blatt für beide. Machen?',
  'Bitte genau einen Token auf der Szene auswählen.':'Eine Figur wählen. Genau eine.',
  'Der Token verwendet jetzt das gemeinsame Charakterblatt.':'Figur hat jetzt dein Blatt.',
  'Die Aktion konnte nicht ausgeführt werden.':'Unga. Geht nicht. Meister gucken.',
  'Der Fokus konnte nicht gespeichert werden.':'Laune nicht gespeichert. Nochmal versuchen.',
  'Das Design konnte nicht gespeichert werden.':'Aussehen nicht gemerkt. Nochmal wählen.',
  'Diese Darstellung ist nicht verfügbar.':'Aussehen nicht da.',
  'Für den Import benötigst du Besitzerrechte auf einem Foundry-Charakter.':'Blatt holen nur für deinen du. Meister fragen.',
  'Bitte einen eigenen Foundry-Charakter auswählen.':'Deinen du wählen. Nicht fremden.',
  'Bitte ein Bild bis 10 MB auswählen.':'Gesicht nehmen. Höchstens 10 MB.',
  'Bitte ein PNG-, JPG-, BMP- oder WebP-Bild auswählen.':'Gesicht braucht PNG, JPG, BMP oder WebP.',
  'Das Bild konnte nicht gelesen werden. Bitte eine gültige Bilddatei auswählen.':'Gesicht kaputt. Anderes Bild nehmen.',
  'Die Datei ist größer als 5 MB.':'Blatt zu dick. Höchstens 5 MB.',
  'Die Datei enthält kein gültiges JSON. Bitte eine gespeicherte Pedipalpus-Charakterdatei auswählen.':'Blatt kaputt. Gespeichertes Pedipalpus-Blatt nehmen.',
  'Zum Bildimport fehlen Upload-Rechte. Dein Meister kann das Bild importieren oder Uploads erlauben.':'Gesicht hochladen verboten. Meister muss helfen.',
  'Zum Ändern des Fokus werden Besitzerrechte benötigt.':'Laune ändern nur für deinen du.',
  'Bitte zuerst eine Charakterdatei importieren.':'Erst Blatt holen.',
  'Der gespeicherte Fokus ist unvollständig. Bitte die Charakterdatei erneut importieren.':'Laune im Blatt kaputt. Blatt nochmal holen.',
  'Der Fokus muss eine ganze Zahl zwischen −4 und 4 sein.':'Laune nur ganze Zahl. Von −4 bis 4.',
  'Bitte eine ganze Zahl für die Erschwernis oder Erleichterung eingeben.':'Schwer oder leicht? Ganze Zahl nehmen.',
  'Einige Kampfproben sind unvollständig. Bitte den Charakter in Pedipalpus speichern und erneut importieren.':'Manches Hauen fehlt. In Pedipalpus speichern. Blatt nochmal holen.'
};

export function uiText(theme, text) {
  if (theme !== 'ork') return text;
  if (Object.hasOwn(words, text)) return words[text];
  let match;
  if ((match = text.match(/^Ucurifunke – Proben ([\d.]+) verbunden$/))) return `Ucurifunke ${match[1]} da. Würfeln geht.`;
  if ((match = text.match(/^Bild ausgewählt: (.*)$/))) return `Gesicht da: ${match[1]}`;
  if ((match = text.match(/^(.*) wurde importiert\.$/))) return `${match[1]} hat Blatt. Gut.`;
  if ((match = text.match(/^Pedipalpus-Bild: (.*)\. Diese separate Bilddatei unten auswählen\.$/))) return `Gesicht liegt hier: ${match[1]}. Bild unten holen.`;
  if ((match = text.match(/^Dateiversion (\d+): geprüft ist Version (\d+)\. Bitte die angezeigten Werte vergleichen\.$/))) return `Blatt ${match[1]}. Geprüft ${match[2]}. Zahlen angucken.`;
  if ((match = text.match(/^Bild übernommen\. (\d+) verknüpfte Tokens konnten mangels Bearbeitungsrecht oder wegen eines Fehlers nicht aktualisiert werden\.$/))) return `Gesicht da. ${match[1]} Figuren gingen nicht. Rechte prüfen. Meister fragen.`;
  if (/Ucurifunke.*aktivieren|Ucurifunke.*aktualisieren|Direktwurf|Würfelbefehl|Modifikator-Dialog/.test(text)) return 'Würfel-Helfer passt nicht. Pedipalpus und Ucurifunke prüfen. Meister holen.';
  if (/Besitzerrechte|bearbeiten|Verknüpfung|ander.*Charakter|eigenes Charakterblatt|Token muss/.test(text)) return 'Blatt und Figur müssen dir gehören und zusammenpassen. Meister fragen.';
  if (/Bild|PNG|Welt.*Bildimport/.test(text)) return 'Gesicht holen ging nicht. Bild und Rechte prüfen. Meister fragen.';
  if (/Charakterdatei|Charakterdaten|Simple Worldbuilding/.test(text)) return 'Blatt passt nicht. Pedipalpus-Blatt und Simple Worldbuilding prüfen.';
  return 'Unga. Geht nicht. Meister gucken.';
}

function copyText(element, theme) {
  for (const node of element.childNodes) {
    if (node.nodeType !== 3 || !node.textContent.trim()) continue;
    const original = node.textContent.trim();
    node.textContent = node.textContent.replace(original, uiText(theme, original));
  }
}

export function localizeSurface(root, theme, character = null, actor = null, token = null) {
  if (theme !== 'ork') return;
  const t = text => uiText(theme,text);
  root.querySelectorAll('.window-title, .pp-picker, .pp-theme, .pp-filters label, .pp-modifier label, .pp-wheel-hint span, .pp-focus > span, .pp-table th, .pp-sr-only, .pp-no-results, .pp-rank-legend span, .pp-status, .pp-hint, .pp-warning, .pp-search-scope, .pp-welcome h2, .pp-welcome p, [data-action="import"], [data-action="token"], [name="modifierDirection"], [name="theme"] option, [name="category"] option, [name="actor"] option[value=""]').forEach(element => copyText(element,theme));
  for (const selector of ['[name="actor"]','[name="theme"]','[name="category"]','[name="search"]','[name="modifier"]','[name="modifierDirection"]','[name="focus"]','[data-action="portrait"]','.pp-focus']) {
    const element = root.querySelector(selector);
    for (const key of ['title','aria-label','placeholder']) if (element?.hasAttribute(key)) element.setAttribute(key,t(element.getAttribute(key)));
  }
  const options = root.querySelectorAll('[name="actor"] option:not([value=""])');
  const suffix = ' · noch kein Import';
  options.forEach(option => { if (option.textContent.endsWith(suffix)) option.textContent = option.textContent.slice(0,-suffix.length) + t(suffix); });
  const speaker = root.querySelector('.pp-status + span');
  if (speaker) speaker.textContent = `${t(actor?.isOwner ? 'Besitzerzugriff' : 'Lesezugriff')} · ${t(token ? 'Token:' : 'Sprecher:')} ${token?.name || actor?.name || character?.profile.name || ''}`;
  const focus = root.querySelector('[name="focus"]');
  if (focus) {
    const value = Number(focus.value);
    const signed = value => value > 0 ? `+${value}` : String(value);
    root.querySelector('[data-focus="off"]').textContent = `${t('OFF')} ${signed(value)}`;
    root.querySelector('[data-focus="def"]').textContent = `${t('DEF')} ${signed(-value)}`;
    focus.setAttribute('aria-valuetext',`${t('OFF')} ${signed(value)}, ${t('DEF')} ${signed(-value)}`);
  }
  const checks = new Map((character?.checks ?? []).map(check => [check.id,check]));
  root.querySelectorAll('.pp-check-row').forEach(row => {
    const check = checks.get(row.dataset.checkId);
    if (!check) return;
    const rating = row.querySelector('.pp-rating');
    const parts = rating.title.split(' · ').map(part => {
      const match = part.match(/^(Talentwert|Probenwert|Wert) (.*)$/);
      return match ? `${t(match[1])} ${match[2]}` : t(part);
    });
    rating.title = parts.join(' · '); rating.setAttribute('aria-label',rating.title);
    row.querySelectorAll('[data-action="roll"]').forEach(button => {
      const blind = button.dataset.blind === 'true';
      const name = check.kind === 'combat' ? `${check.combat.weaponName} · ${t({attack:'Angriff',parry:'Parade',ranged:'Fernkampf'}[check.combat.type])}` : check.name;
      button.setAttribute('aria-label',`${name} ${t(blind ? 'verdeckt würfeln – Ergebnis nur für Spielleiter' : 'würfeln')}`);
      button.title = button.disabled ? t(button.title) : button.getAttribute('aria-label');
    });
    if (check.kind === 'combat') {
      const label = t({attack:'Angriff',parry:'Parade',ranged:'Fernkampf'}[check.combat.type]);
      const name = row.querySelector('.pp-check-name');
      for (const node of name.childNodes) if (node.nodeType === 3) node.textContent = `${name.querySelector('.pp-master-star') ? ' ' : ''}${check.combat.weaponName} · ${label}`;
      const subtitle = row.querySelector('small');
      if (!check.id.startsWith('animals:')) subtitle.textContent = `${check.combat.skillName} · ${t('Talent')} ${check.combat.skillValue}`;
      row.querySelector('.pp-single-probe').title = `${t('Fertigkeit')} ${check.combat.skillValue} + ${t('Basis')} ${check.combat.baseValue} + ${t('Fokus')} ${check.combat.focusValue} + ${t('Waffenbonus')} ${check.combat.weaponModifier} − BE ${check.combat.mobilityPenalty}`;
      row.querySelector('.pp-single-probe').textContent = `${{attack:'Hau',parry:'Block',ranged:'Weit'}[check.combat.type]} · 1W20`;
    } else if (!check.foundation && ['primary','secondary','Spells','Rituals','Miracles'].includes(check.id.split(':')[0])) {
      row.querySelector('small').textContent = t(check.group);
    }
  });
}

export function localizeDialog(root, theme) {
  if (theme !== 'ork') return;
  root.querySelectorAll('.window-title, label, .pp-import-preview, .pp-portrait-preview, .pp-portrait-source, .pp-import > p, [name="destination"] option[value=""]').forEach(element => copyText(element,theme));
}
