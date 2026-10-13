export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const e = escapeHTML;
const num = value => typeof value === 'number' ? value.toLocaleString('de-DE', { maximumFractionDigits: 2 }) : '–';
const box = value => `<span class="pp-number-box">${num(value)}</span>`;
const button = (action, label, extras = '') => `<button type="button" data-action="${action}" ${extras}>${label}</button>`;
const group = (title, content, className = '') => `<fieldset class="pp-group ${className}"><legend>${e(title)}</legend>${content}</fieldset>`;
const empty = label => `<p class="pp-empty">${e(label || 'Keine Einträge.')}</p>`;
export const MAIN_TABS = [['biography', 'Biografie'], ['attributes', 'Attribute'], ['advantages', 'Vor- und Nachteile'], ['conditions', 'Zustände'], ['mundane', 'Mundane Fertigkeiten'], ['magic', 'Magische Fertigkeiten'], ['clerical', 'Klerikale Fertigkeiten'], ['inventory', 'Inventar']];
export const CATEGORIES = [['BodySkills', 'Körperlich'], ['SocialSkills', 'Sozial'], ['NatureSkills', 'Natur'], ['AcademicSkills', 'Akademisch'], ['CraftingSkills', 'Handwerklich']];
const table = (headers, rows) => `<div class="pp-table-scroll"><table class="pp-table"><thead><tr>${headers.map(header => `<th scope="col">${e(header)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.join('') : `<tr><td colspan="${headers.length}" class="pp-empty">Keine Einträge.</td></tr>`}</tbody></table></div>`;
const rollButton = (check, disabled) => check ? button('roll', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 22 8v9l-10 5L2 17V8L12 2Zm0 0L7 10l5 12 5-12L12 2ZM2 8l5 2h10l5-2M2 17l5-7m15 7-5-7"/></svg>',
  `class="pp-dice-button" data-check="${e(check.id)}" aria-label="${e(check.name)} würfeln" title="${e(check.reason || `${check.name} würfeln`)}" ${disabled || check.reason ? 'disabled' : ''}`) : '';
const trio = attributes => `<div class="pp-trio">${attributes.map(att => `<span><span class="pp-attribute-label">${e(att.short || att.name)}</span>${box(att.value)}</span>`).join('')}</div>`;

function checkTable(checks, disabled) {
  return table(['Fertigkeit', 'Probe', 'Gesamtwert', 'Würfeln'], checks.map(check => `<tr><td>${e(check.name)}${check.reason ? `<small class="pp-reason">${e(check.reason)}</small>` : ''}</td><td>${trio(check.attributes)}</td><td>${box(check.value)}</td><td>${rollButton(check, disabled)}</td></tr>`));
}
function generalSkills(character, disabled, category, search) {
  const foundations = new Map();
  for (const check of character.checks.filter(check => CATEGORIES.some(([key]) => check.id.startsWith(key + ':')))) {
    const key = check.id.split(':').slice(0, 2).join(':');
    if (!foundations.has(key)) foundations.set(key, []);
    foundations.get(key).push(check);
  }
  return `<div class="pp-general-skills pp-two-columns pp-with-sidebar">${group('Kategorie', `<div class="pp-categories">${CATEGORIES.map(([key, label]) => `<label><input type="radio" name="category" value="${key}" ${key === category ? 'checked' : ''}>${e(label)}</label>`).join('')}</div>`, 'pp-category-box')}
    <div class="pp-skill-area"><label class="pp-search"><input type="search" name="search" placeholder="Fertigkeit suchen …" aria-label="Fertigkeiten durchsuchen" value="${e(search)}"></label><p class="pp-search-scope" ${search ? '' : 'hidden'}>Suchergebnisse in allen Kategorien</p>
    <div class="pp-table-scroll"><div class="pp-skill-table"><div class="pp-foundation-header"><span>Fertigkeit</span><span>Probe</span><span>Wert</span><div class="pp-specialization-head"><span>Spezialisierungen</span><span>Wert</span><span>Gesamtwert</span><span></span></div></div>
    ${[...foundations.values()].map(checks => {
      const first = checks[0];
      const foundation = first.foundation || first.group.split(' · ').slice(1).join(' · ');
      return `<section class="pp-check-group pp-foundation-row" data-category="${e(first.category || first.id.split(':')[0])}"><div class="pp-foundation-name">${e(foundation)}</div><div>${trio(first.attributes)}</div><div class="pp-foundation-value">${box(first.foundationValue)}</div><div class="pp-specializations">${checks.map(check => `<div class="pp-check-row" data-search="${e(`${check.group} ${check.name}`.toLocaleLowerCase('de'))}"><span>${e(check.name)}${check.reason ? `<small class="pp-reason">${e(check.reason)}</small>` : ''}</span>${box(check.specializationValue)}<span class="pp-total">${num(check.value)}</span>${rollButton(check, disabled)}</div>`).join('')}</div></section>`;
    }).join('')}</div></div><p class="pp-no-results" hidden>Keine passende Fertigkeit gefunden.</p></div></div>`;
}
function detailTable(character, name, firstColumn = 'Bezeichnung') {
  const entries = character.details.find(group => group.name === name)?.entries ?? [];
  return table([firstColumn, 'Beschreibung', 'Kosten'], entries.map(entry => `<tr><td>${e(entry.name)}${entry.level !== null ? ` <small>(Stufe ${num(entry.level)})</small>` : ''}</td><td><details class="pp-description pp-item"><summary>Beschreibung</summary><p class="pp-prose">${e(entry.description || 'Keine Beschreibung hinterlegt.')}</p></details></td><td>${num(entry.cost)}</td></tr>`));
}
function attributes(character, disabled) {
  const render = (list, prefix) => table(['Attribut', 'Kürzel', 'Grundwert', 'Modifikator', 'Gesamtwert', ''], list.map((att, index) => `<tr><td>${e(att.name)}</td><td>${e(att.short)}</td><td>${box(att.base)}</td><td>${box(att.modifier)}</td><td>${num(att.value)}</td><td>${rollButton(character.checks.find(check => check.id === `${prefix}:${index}`), disabled)}</td></tr>`));
  return `<div class="pp-two-columns"><div>${group('Primäre Attribute', render(character.attributes, 'primary'))}${group('Sekundäre Attribute', render(character.secondary ?? character.checks.filter(x => x.id.startsWith('secondary:')).map(x => ({ name: x.name, value: x.value })), 'secondary'))}</div>
    ${group('Abgeleitete Werte', table(['Wert', 'Kürzel', 'Grundwert', 'Modifikator', 'Gesamtwert'], character.derived.map(stat => `<tr><td>${e(stat.name)}</td><td>${e(stat.short)}</td><td>${box(stat.base)}</td><td>${box(stat.modifier)}</td><td>${num(stat.value)}</td></tr>`)))}</div>`;
}
function biography(character) {
  const profile = character.profile;
  return `<div class="pp-two-columns pp-with-sidebar">${group('Grundangaben', [['Name', profile.name], ['Heimatkultur', profile.culture], ['Subkultur', profile.subCulture], ['Soziale Schicht', profile.socialClass], ['Volk', profile.race]].map(([label, value]) => `<label class="pp-profile-field"><span>${e(label)}</span><span class="pp-readonly-text">${e(value || '–')}</span></label>`).join(''))}
    ${group('Tagebuch', table(['Ereignis', 'Beschreibung', 'Datum'], (character.journal ?? []).map(entry => `<tr><td>${e(entry.title)}</td><td><details class="pp-item"><summary>Beschreibung</summary><p class="pp-prose">${e(entry.description)}</p></details></td><td>${e(entry.date)}</td></tr>`)) + (profile.notes ? `<p class="pp-prose">${e(profile.notes)}</p>` : ''))}</div>`;
}
function combat(character) {
  const skillTable = skills => table(['Kampftechnik', 'Wert'], (skills ?? []).map(skill => `<tr><td>${e(skill.name)}</td><td>${box(skill.value)}</td></tr>`));
  return `<p class="pp-hint">Kampfwerte aus dem Import. Kampfproben folgen nach dem Probenmodul-Update.</p><div class="pp-combat-layout">${group('Relevante Werte', (character.combat?.stats ?? []).map(stat => `<div class="pp-stat-row"><span>${e(stat.name)}</span><span class="pp-number-box">${e(stat.value)}</span></div>`).join(''))}${group('Nahkampf', skillTable(character.combat?.melee))}${group('Fernkampf', skillTable(character.combat?.ranged))}${group('Kampfsonderfertigkeiten', detailTable(character, 'Kampfsonderfertigkeiten', 'Sonderfertigkeit'))}</div>`;
}
function equipment(character, names) {
  return names.map(name => {
    const items = character.equipment.filter(item => item.group === name);
    return group(name === 'Parierwaffen' ? 'Schilde und Parierwaffen' : name === 'Gegenstände' ? 'Alltagsgegenstände' : name,
      table(['Bezeichnung', 'Grundwerte / Beschreibung', 'Menge', 'Gewicht', 'Dabei?'], items.map(item => `<tr><td>${e(item.name)}</td><td><details class="pp-item"><summary>${e(item.damage || item.material || item.species || 'Beschreibung')}</summary>${item.technique ? `<p>Fertigkeit: ${e(item.technique)}</p>` : ''}<p class="pp-prose">${e(item.description || 'Keine Beschreibung hinterlegt.')}</p></details></td><td>${num(item.quantity)}</td><td>${num(item.weight)}</td><td><input type="checkbox" aria-label="${e(item.name)} dabei" ${item.carried ? 'checked' : ''} disabled></td></tr>`)));
  }).join('');
}
const subnav = (owner, tabs, current) => `<nav class="pp-subtabs" aria-label="${owner === 'mundane' ? 'Mundane Fertigkeiten' : 'Unterbereiche'}">${tabs.map(([id, label]) => button('subtab', label, `data-owner="${owner}" data-subtab="${id}" aria-pressed="${current === id}"`)).join('')}</nav>`;
const subpanel = (owner, id, selected, content) => `<div class="pp-subpanel" data-subpanel="${id}" data-owner="${owner}" ${id === selected ? '' : 'hidden'}>${content}</div>`;

export function renderView({ actors, actor, character, status, canImport, token, search = '', tab = 'mundane', category = 'BodySkills', subTabs = {}, theme = 'dark' }) {
  const options = actors.map(item => `<option value="${e(item.id)}" ${item.id === actor?.id ? 'selected' : ''}>${e(item.name)}${item.hasCharacter ? '' : ' · noch kein Import'}</option>`).join('');
  const picker = `<div class="pp-toolbar"><label class="pp-picker">Foundry-Charakter<select name="actor" aria-label="Foundry-Charakter"><option value="">Charakter auswählen …</option>${options}</select></label>${button('import', 'Charakter importieren', `class="pp-primary" ${canImport ? '' : 'disabled'}`)}<label class="pp-theme-picker">Darstellung<select name="theme" aria-label="Darstellung"><option value="dark" ${theme === 'dark' ? 'selected' : ''}>Dunkel</option><option value="light" ${theme === 'light' ? 'selected' : ''}>Hell</option></select></label></div>`;
  if (!character) return `<div class="pp-root" data-theme="${e(theme)}">${picker}<div class="pp-welcome"><h2>Charaktereditor — Pedipalpus</h2><p>Eine gespeicherte Pedipalpus-Charakterdatei importieren und direkt in Foundry würfeln.</p><ol><li>JSON-Datei auswählen.</li><li>Einem Foundry-Charakter zuordnen oder einen neuen anlegen.</li><li>Den Charakter als Token auf die Szene ziehen.</li></ol><p class="pp-hint">Zum Import benötigst du Besitzerrechte oder die Berechtigung, einen Charakter anzulegen.</p></div></div>`;
  const disabled = !status.ready || !actor?.isOwner;
  const profile = character.profile;
  const date = new Date(character.importedAt);
  const mundaneTab = subTabs.mundane ?? 'general', magicTab = subTabs.magic ?? 'spells', clericalTab = subTabs.clerical ?? 'miracles', inventoryTab = subTabs.inventory ?? 'everyday';
  const panel = (id, content) => `<section class="pp-panel" data-panel="${id}" ${tab === id ? '' : 'hidden'}>${content}</section>`;
  const mundane = subnav('mundane', [['combat', 'Kampftechniken'], ['general', 'Allgemeine Fertigkeiten'], ['special', 'Sonderfertigkeiten'], ['hobbies', 'Freizeitfertigkeiten']], mundaneTab)
    + subpanel('mundane', 'combat', mundaneTab, combat(character))
    + subpanel('mundane', 'general', mundaneTab, generalSkills(character, disabled, category, search))
    + subpanel('mundane', 'special', mundaneTab, `<div class="pp-two-columns">${group('Erlernte Sonderfertigkeiten', detailTable(character, 'Allgemeine Sonderfertigkeiten', 'Sonderfertigkeit'))}<div>${group('Sprachen und Schriften', ['Sprachen', 'Schriften'].map(name => `<h3>${e(name)}</h3>${table(['Bezeichnung', 'Stufe'], (character.details.find(group => group.name === name)?.entries ?? []).map(entry => `<tr><td>${e(entry.name)}</td><td>${num(entry.level)}</td></tr>`))}`).join(''))}</div></div>`)
    + subpanel('mundane', 'hobbies', mundaneTab, group('Erlernte Freizeitfertigkeiten', checkTable(character.checks.filter(check => check.id.startsWith('HobbySkills:')), disabled)));
  const magic = subnav('magic', [['spells', 'Spruchzauberei'], ['rituals', 'Ritualmagie'], ['shaman', 'Schamanismus'], ['special', 'Sonderfertigkeiten']], magicTab)
    + subpanel('magic', 'spells', magicTab, group('Zaubersprüche', checkTable(character.checks.filter(check => check.id.startsWith('Spells:')), disabled)))
    + subpanel('magic', 'rituals', magicTab, group('Erlernte Rituale', checkTable(character.checks.filter(check => check.id.startsWith('Rituals:')), disabled)))
    + subpanel('magic', 'shaman', magicTab, group('Erlernte Riten', detailTable(character, 'Riten', 'Ritus')))
    + subpanel('magic', 'special', magicTab, group('Erlernte Sonderfertigkeiten', detailTable(character, 'Magische Sonderfertigkeiten', 'Sonderfertigkeit')));
  const clerical = group('Kirche', `<span class="pp-readonly-text">${e(profile.church || 'Keine Kirche hinterlegt.')}</span>`)
    + subnav('clerical', [['miracles', 'Liturgien'], ['special', 'Sonderfertigkeiten']], clericalTab)
    + subpanel('clerical', 'miracles', clericalTab, checkTable(character.checks.filter(check => check.id.startsWith('Miracles:')), disabled))
    + subpanel('clerical', 'special', clericalTab, detailTable(character, 'Göttliche Sonderfertigkeiten', 'Sonderfertigkeit'));
  const inventory = `<div class="pp-weight-line">Getragenes Gewicht: ${num(profile.weight)} kg · Tragkraft: ${num(profile.capacity)} kg</div>` + subnav('inventory', [['everyday', 'Geld und Alltag'], ['arsenal', 'Arsenal'], ['armor', 'Rüstungen'], ['animals', 'Tiere']], inventoryTab)
    + subpanel('inventory', 'everyday', inventoryTab, `<div class="pp-two-columns">${group('Geld', table(['Lagerort', 'Gold', 'Silber', 'Kupfer', 'Eisen'], (character.money ?? []).map(money => `<tr><td>${e(money.location)}</td><td>${num(money.gold)}</td><td>${num(money.silver)}</td><td>${num(money.copper)}</td><td>${num(money.iron)}</td></tr>`)))}<div>${equipment(character, ['Gegenstände'])}</div></div>`)
    + subpanel('inventory', 'arsenal', inventoryTab, `<div class="pp-two-columns"><div>${equipment(character, ['Nahkampfwaffen'])}</div><div>${equipment(character, ['Parierwaffen', 'Fernkampfwaffen', 'Munition'])}</div></div>`)
    + subpanel('inventory', 'armor', inventoryTab, equipment(character, ['Rüstungen']))
    + subpanel('inventory', 'animals', inventoryTab, equipment(character, ['Tiere']));
  return `<div class="pp-root" data-theme="${e(theme)}">${picker}<div class="pp-editor-header">
    ${group('Energien', ['LE', 'AE', 'KE'].map(name => { const stat = character.resources.find(x => x.name === name); return `<div class="pp-energy ${stat ? '' : 'pp-inactive'}"><span>${name}</span>${box(stat?.value ?? 0)}${box(stat?.max ?? 0)}</div>`; }).join(''), 'pp-energies')}
    ${group('Willenskraft', box(profile.willpower) + box(profile.willpowerTotal))}
    ${group('Abenteuerpunkte', `<div>${box(profile.apAvailable)}${box(profile.apTotal)}<small>Verfügbar / Gesamt</small></div>`)}
    ${group('Attributs-AP', `${box(profile.attributeAP)}${box(profile.attributeAPTotal)}`)}
    </div><div class="pp-status ${status.ready ? '' : 'pp-warning'}"><span>${e(status.message)}</span><span>${actor?.isOwner ? 'Besitzerzugriff' : 'Lesezugriff'} · Werte aus letztem Import</span></div>
    ${character.warnings.map(warning => `<p class="pp-warning">${e(warning)}</p>`).join('')}
    <nav class="pp-tabs" aria-label="Charakterbereiche">${MAIN_TABS.map(([id, label]) => button('tab', label, `data-tab="${id}" aria-pressed="${tab === id}"`)).join('')}</nav>
    ${panel('biography', biography(character))}${panel('attributes', attributes(character, disabled))}
    ${panel('advantages', `<div class="pp-two-columns">${group('Vorteile', detailTable(character, 'Vorteile', 'Vorteil'))}${group('Nachteile', detailTable(character, 'Nachteile', 'Nachteil'))}</div>`)}
    ${panel('conditions', `<div class="pp-two-columns">${group('Stufenlose Zustände', table(['Zustand', 'Aktiv'], (character.conditions?.simple ?? []).map(item => `<tr><td>${e(item.name)}</td><td><input type="checkbox" ${item.active ? 'checked' : ''} disabled aria-label="${e(item.name)} aktiv"></td></tr>`)))}${group('Abgestufte Zustände', table(['Zustand', 'Stufe'], (character.conditions?.complex ?? []).map(item => `<tr><td>${e(item.name)}</td><td>${box(item.level)}</td></tr>`)))}</div>`)}
    ${panel('mundane', mundane)}${panel('magic', magic)}${panel('clerical', clerical)}${panel('inventory', inventory)}
    <footer class="pp-footer"><span>${token ? `Token: ${e(token.name)}` : 'Würfe für den gewählten Foundry-Charakter.'}</span>${button('token', 'Ausgewählten Token verknüpfen', actor?.isOwner ? '' : 'disabled')}<span>Import: ${e(Number.isNaN(date.getTime()) ? '' : date.toLocaleString('de-DE'))} · Werte in Pedipalpus ändern und erneut importieren.</span></footer></div>`;
}
export function renderImportOptions(actors, selectedId, canCreate) {
  return `<div class="pp-import"><label>Pedipalpus-Charakterdatei<input type="file" name="characterFile" accept=".json,application/json" required></label><p class="pp-import-preview">Bitte eine JSON-Datei auswählen.</p><label>In Foundry speichern als<select name="destination">${canCreate ? `<option value="" ${selectedId ? '' : 'selected'}>Neuen Charakter anlegen</option>` : ''}${actors.map(actor => `<option value="${e(actor.id)}" ${actor.id === selectedId ? 'selected' : ''}>${e(actor.name)}</option>`).join('')}</select></label><p>Beim erneuten Import wird das Pedipalpus-Blatt ersetzt. Token, Bild, Berechtigungen und vorhandene Foundry-Werte bleiben erhalten.</p></div>`;
}
