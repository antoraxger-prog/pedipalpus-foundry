export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const e = escapeHTML;
const num = value => typeof value === 'number' ? value.toLocaleString('de-DE', { maximumFractionDigits: 2 }) : '–';
const box = value => `<span class="pp-number-box">${num(value)}</span>`;
const field = (character, path, value, label, type = 'number') => {
  if (!character.editable) return type === 'text' || type === 'textarea' ? `<span class="pp-readonly-text">${e(value || '–')}</span>` : box(value);
  const attrs = `data-edit="${e(path)}" aria-label="${e(label)}"`;
  if (type === 'textarea') return `<textarea class="pp-edit-text" ${attrs}>${e(value)}</textarea>`;
  return `<input class="${type === 'number' ? 'pp-number-box' : 'pp-edit-text'}" type="${type}" ${attrs} ${type === 'number' ? 'step="any"' : ''} value="${e(value ?? '')}">`;
};
const toggle = (character, path, value, label) => `<input type="checkbox" data-edit="${e(path)}" aria-label="${e(label)}" ${value ? 'checked' : ''} ${character.editable ? '' : 'disabled'}>`;
const display = (path, value) => `<span data-display="${e(path)}">${num(value)}</span>`;
const button = (action, label, extras = '') => `<button type="button" data-action="${action}" ${extras}>${label}</button>`;
const group = (title, content, className = '') => `<fieldset class="pp-group ${className}"><legend>${e(title)}</legend>${content}</fieldset>`;
const empty = label => `<p class="pp-empty">${e(label || 'Keine Einträge.')}</p>`;
export const MAIN_TABS = [['biography', 'Biografie'], ['attributes', 'Attribute'], ['advantages', 'Vor- und Nachteile'], ['conditions', 'Zustände'], ['mundane', 'Mundane Fertigkeiten'], ['magic', 'Magische Fertigkeiten'], ['clerical', 'Klerikale Fertigkeiten'], ['inventory', 'Inventar']];
export const CATEGORIES = [['BodySkills', 'Körperlich'], ['SocialSkills', 'Sozial'], ['NatureSkills', 'Natur'], ['AcademicSkills', 'Akademisch'], ['CraftingSkills', 'Handwerklich']];
const table = (headers, rows) => `<div class="pp-table-scroll"><table class="pp-table"><thead><tr>${headers.map(header => `<th scope="col">${e(header)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.join('') : `<tr><td colspan="${headers.length}" class="pp-empty">Keine Einträge.</td></tr>`}</tbody></table></div>`;
const rollButton = (check, disabled) => check ? button('roll', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 22 8v9l-10 5L2 17V8L12 2Zm0 0L7 10l5 12 5-12L12 2ZM2 8l5 2h10l5-2M2 17l5-7m15 7-5-7"/></svg>',
  `class="pp-dice-button" data-check="${e(check.id)}" aria-label="${e(check.name)} würfeln" title="${e(check.reason || `${check.name} würfeln`)}" ${disabled || check.reason ? 'disabled' : ''}`) : '';
const trio = attributes => `<div class="pp-trio">${attributes.map(att => `<span><span class="pp-attribute-label">${e(att.short || att.name)}</span>${box(att.value)}</span>`).join('')}</div>`;
export const renderProbe = trio;

function checkTable(checks, disabled, character) {
  return table(['Fertigkeit', 'Probe', 'Gesamtwert', 'Würfeln'], checks.map(check => `<tr><td>${e(check.name)}${check.reason ? `<small class="pp-reason">${e(check.reason)}</small>` : ''}</td><td data-probe="${e(check.id)}">${trio(check.attributes)}</td><td>${field(character, `checks.${check.id}.value`, check.value, `${check.name} Gesamtwert`)}</td><td>${rollButton(check, disabled)}</td></tr>`));
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
      return `<section class="pp-check-group pp-foundation-row" data-category="${e(first.category || first.id.split(':')[0])}"><div class="pp-foundation-name">${e(foundation)}</div><div data-probe="${e(first.id)}">${trio(first.attributes)}</div><div class="pp-foundation-value">${field(character, `checks.${first.id}.foundationValue`, first.foundationValue, `${foundation} Grundwert`)}</div><div class="pp-specializations">${checks.map(check => `<div class="pp-check-row" data-search="${e(`${check.group} ${check.name}`.toLocaleLowerCase('de'))}"><span>${e(check.name)}${check.reason ? `<small class="pp-reason">${e(check.reason)}</small>` : ''}</span>${field(character, `checks.${check.id}.specializationValue`, check.specializationValue, `${check.name} Spezialisierungswert`)}<span class="pp-total">${display(`checks.${check.id}.value`, check.value)}</span>${rollButton(check, disabled)}</div>`).join('')}</div></section>`;
    }).join('')}</div></div><p class="pp-no-results" hidden>Keine passende Fertigkeit gefunden.</p></div></div>`;
}
function detailTable(character, name, firstColumn = 'Bezeichnung') {
  const index = character.details.findIndex(group => group.name === name);
  const entries = character.details[index]?.entries ?? [];
  return table([firstColumn, 'Beschreibung', 'Stufe', 'Kosten'], entries.map((entry, i) => {
    const path = `details.${index}.entries.${i}`;
    return `<tr><td>${field(character, `${path}.name`, entry.name, `${entry.name} Bezeichnung`, 'text')}</td><td><details class="pp-description pp-item"><summary>Beschreibung</summary>${field(character, `${path}.description`, entry.description, `${entry.name} Beschreibung`, 'textarea')}</details></td><td>${field(character, `${path}.level`, entry.level, `${entry.name} Stufe`)}</td><td>${field(character, `${path}.cost`, entry.cost, `${entry.name} Kosten`)}</td></tr>`;
  }));
}
function attributes(character, disabled) {
  const render = (list, prefix) => table(['Attribut', 'Kürzel', 'Grundwert', 'Modifikator', 'Gesamtwert', ''], list.map((att, index) => {
    const path = `${prefix === 'primary' ? 'attributes' : 'secondary'}.${index}`;
    return `<tr><td>${e(att.name)}</td><td>${e(att.short)}</td><td>${field(character, `${path}.base`, att.base ?? att.value - (att.modifier ?? 0), `${att.name} Grundwert`)}</td><td>${field(character, `${path}.modifier`, att.modifier ?? 0, `${att.name} Modifikator`)}</td><td>${display(`${path}.value`, att.value)}</td><td>${rollButton(character.checks.find(check => check.id === `${prefix}:${index}`), disabled)}</td></tr>`;
  }));
  return `<div class="pp-two-columns"><div>${group('Primäre Attribute', render(character.attributes, 'primary'))}${group('Sekundäre Attribute', render(character.secondary ?? character.checks.filter(x => x.id.startsWith('secondary:')).map(x => ({ name: x.name, value: x.value })), 'secondary'))}</div>
    ${group('Abgeleitete Werte', table(['Wert', 'Kürzel', 'Grundwert', 'Modifikator', 'Gesamtwert'], character.derived.map((stat, i) => `<tr><td>${e(stat.name)}</td><td>${e(stat.short)}</td><td>${field(character, `derived.${i}.base`, stat.base ?? stat.value - (stat.modifier ?? 0), `${stat.name} Grundwert`)}</td><td>${field(character, `derived.${i}.modifier`, stat.modifier ?? 0, `${stat.name} Modifikator`)}</td><td>${display(`derived.${i}.value`, stat.value)}</td></tr>`)))}</div>`;
}
function biography(character) {
  const profile = character.profile;
  return `<div class="pp-two-columns pp-with-sidebar">${group('Grundangaben', [['Name', 'name'], ['Heimatkultur', 'culture'], ['Subkultur', 'subCulture'], ['Soziale Schicht', 'socialClass'], ['Volk', 'race']].map(([label, key]) => `<label class="pp-profile-field"><span>${e(label)}</span>${field(character, `profile.${key}`, profile[key], label, 'text')}</label>`).join(''))}
    ${group('Tagebuch', table(['Ereignis', 'Beschreibung', 'Datum'], (character.journal ?? []).map((entry, i) => `<tr><td>${field(character, `journal.${i}.title`, entry.title, `Tagebuch ${i + 1} Titel`, 'text')}</td><td><details class="pp-item"><summary>Beschreibung</summary>${field(character, `journal.${i}.description`, entry.description, `Tagebuch ${i + 1} Beschreibung`, 'textarea')}</details></td><td>${field(character, `journal.${i}.date`, entry.date, `Tagebuch ${i + 1} Datum`, 'text')}</td></tr>`)) + `<label class="pp-profile-field"><span>Notizen</span>${field(character, 'profile.notes', profile.notes, 'Notizen', 'textarea')}</label>`)}</div>`;
}
function combat(character) {
  const skillTable = key => table(['Kampftechnik', 'Wert'], (character.combat?.[key] ?? []).map((skill, i) => `<tr><td>${e(skill.name)}</td><td>${field(character, `combat.${key}.${i}.value`, skill.value, `${skill.name} Kampfwert`)}</td></tr>`));
  return `<p class="pp-hint">Kampfwerte können angepasst werden. Kampfproben sind hier noch nicht angebunden.</p><div class="pp-combat-layout">${group('Relevante Werte', (character.combat?.stats ?? []).map((stat, i) => `<div class="pp-stat-row"><span>${e(stat.name)}</span>${field(character, `combat.stats.${i}.value`, stat.value, `${stat.name} Kampfwert`)}</div>`).join(''))}${group('Nahkampf', skillTable('melee'))}${group('Fernkampf', skillTable('ranged'))}${group('Kampfsonderfertigkeiten', detailTable(character, 'Kampfsonderfertigkeiten', 'Sonderfertigkeit'))}</div>`;
}
function equipment(character, names) {
  return names.map(name => {
    const items = character.equipment.filter(item => item.group === name);
    return group(name === 'Parierwaffen' ? 'Schilde und Parierwaffen' : name === 'Gegenstände' ? 'Alltagsgegenstände' : name,
      table(['Bezeichnung', 'Grundwerte / Beschreibung', 'Menge', 'Gewicht', 'Dabei?'], items.map(item => {
        const path = `equipment.${character.equipment.indexOf(item)}`;
        return `<tr><td>${field(character, `${path}.name`, item.name, `${item.name} Bezeichnung`, 'text')}</td><td><details class="pp-item"><summary>${e(item.damage || item.material || item.species || 'Beschreibung')}</summary>${['damage', 'technique', 'armor', 'attack', 'defense', 'ticks', 'penalty', 'material', 'species', 'currentLE', 'maxLE', 'capacity'].filter(key => item[key] !== null && item[key] !== '').map(key => `<label class="pp-profile-field"><span>${e(({damage:'Schaden',technique:'Fertigkeit',armor:'Schutz',attack:'Angriffsbonus',defense:'Abwehrbonus',ticks:'Ticks',penalty:'Behinderung',material:'Material',species:'Tierart',currentLE:'LE aktuell',maxLE:'LE maximal',capacity:'Tragkraft'})[key])}</span>${field(character, `${path}.${key}`, item[key], `${item.name} ${key}`, typeof item[key] === 'number' ? 'number' : 'text')}</label>`).join('')}${field(character, `${path}.description`, item.description, `${item.name} Beschreibung`, 'textarea')}</details></td><td>${field(character, `${path}.quantity`, item.quantity, `${item.name} Menge`)}</td><td>${field(character, `${path}.weight`, item.weight, `${item.name} Gewicht`)}</td><td>${toggle(character, `${path}.carried`, item.carried, `${item.name} dabei`)}</td></tr>`;
      })));
  }).join('');
}
const subnav = (owner, tabs, current) => `<nav class="pp-subtabs" aria-label="${owner === 'mundane' ? 'Mundane Fertigkeiten' : 'Unterbereiche'}">${tabs.map(([id, label]) => button('subtab', label, `data-owner="${owner}" data-subtab="${id}" aria-pressed="${current === id}"`)).join('')}</nav>`;
const subpanel = (owner, id, selected, content) => `<div class="pp-subpanel" data-subpanel="${id}" data-owner="${owner}" ${id === selected ? '' : 'hidden'}>${content}</div>`;

export function renderView({ actors, actor, character, status, canImport, token, search = '', tab = 'mundane', category = 'BodySkills', subTabs = {}, theme = 'dark' }) {
  const options = actors.map(item => `<option value="${e(item.id)}" ${item.id === actor?.id ? 'selected' : ''}>${e(item.name)}${item.hasCharacter ? '' : ' · noch kein Import'}</option>`).join('');
  const picker = `<div class="pp-toolbar"><label class="pp-picker">Foundry-Charakter<select name="actor" aria-label="Foundry-Charakter"><option value="">Charakter auswählen …</option>${options}</select></label>${button('import', 'Charakter importieren', `class="pp-primary" ${canImport ? '' : 'disabled'}`)}<label class="pp-theme-picker">Darstellung<select name="theme" aria-label="Darstellung"><option value="dark" ${theme === 'dark' ? 'selected' : ''}>Dunkel</option><option value="light" ${theme === 'light' ? 'selected' : ''}>Hell</option></select></label></div>`;
  if (!character) return `<div class="pp-root" data-theme="${e(theme)}">${picker}<div class="pp-welcome"><h2>Charaktereditor — Pedipalpus</h2><p>Eine gespeicherte Pedipalpus-Charakterdatei importieren und direkt in Foundry würfeln.</p><ol><li>JSON-Datei auswählen.</li><li>Einem Foundry-Charakter zuordnen oder einen neuen anlegen.</li><li>Den Charakter als Token auf die Szene ziehen.</li></ol><p class="pp-hint">Zum Import benötigst du Besitzerrechte oder die Berechtigung, einen Charakter anzulegen.</p></div></div>`;
  character = { ...character, editable: actor?.isOwner === true };
  const disabled = !status.ready || !actor?.isOwner;
  const profile = character.profile;
  const date = new Date(character.importedAt);
  const mundaneTab = subTabs.mundane ?? 'general', magicTab = subTabs.magic ?? 'spells', clericalTab = subTabs.clerical ?? 'miracles', inventoryTab = subTabs.inventory ?? 'everyday';
  const panel = (id, content) => `<section class="pp-panel" data-panel="${id}" ${tab === id ? '' : 'hidden'}>${content}</section>`;
  const mundane = subnav('mundane', [['combat', 'Kampftechniken'], ['general', 'Allgemeine Fertigkeiten'], ['special', 'Sonderfertigkeiten'], ['hobbies', 'Freizeitfertigkeiten']], mundaneTab)
    + subpanel('mundane', 'combat', mundaneTab, combat(character))
    + subpanel('mundane', 'general', mundaneTab, generalSkills(character, disabled, category, search))
    + subpanel('mundane', 'special', mundaneTab, `<div class="pp-two-columns">${group('Erlernte Sonderfertigkeiten', detailTable(character, 'Allgemeine Sonderfertigkeiten', 'Sonderfertigkeit'))}<div>${group('Sprachen und Schriften', ['Sprachen', 'Schriften'].map(name => `<h3>${e(name)}</h3>${table(['Bezeichnung', 'Stufe'], (character.details.find(group => group.name === name)?.entries ?? []).map(entry => `<tr><td>${e(entry.name)}</td><td>${num(entry.level)}</td></tr>`))}`).join(''))}</div></div>`)
    + subpanel('mundane', 'hobbies', mundaneTab, group('Erlernte Freizeitfertigkeiten', checkTable(character.checks.filter(check => check.id.startsWith('HobbySkills:')), disabled, character)));
  const magic = subnav('magic', [['spells', 'Spruchzauberei'], ['rituals', 'Ritualmagie'], ['shaman', 'Schamanismus'], ['special', 'Sonderfertigkeiten']], magicTab)
    + subpanel('magic', 'spells', magicTab, group('Zaubersprüche', checkTable(character.checks.filter(check => check.id.startsWith('Spells:')), disabled, character)))
    + subpanel('magic', 'rituals', magicTab, group('Erlernte Rituale', checkTable(character.checks.filter(check => check.id.startsWith('Rituals:')), disabled, character)))
    + subpanel('magic', 'shaman', magicTab, group('Erlernte Riten', detailTable(character, 'Riten', 'Ritus')))
    + subpanel('magic', 'special', magicTab, group('Erlernte Sonderfertigkeiten', detailTable(character, 'Magische Sonderfertigkeiten', 'Sonderfertigkeit')));
  const clerical = group('Kirche', field(character, 'profile.church', profile.church, 'Kirche', 'text'))
    + subnav('clerical', [['miracles', 'Liturgien'], ['special', 'Sonderfertigkeiten']], clericalTab)
    + subpanel('clerical', 'miracles', clericalTab, checkTable(character.checks.filter(check => check.id.startsWith('Miracles:')), disabled, character))
    + subpanel('clerical', 'special', clericalTab, detailTable(character, 'Göttliche Sonderfertigkeiten', 'Sonderfertigkeit'));
  const inventory = `<div class="pp-weight-line">Getragenes Gewicht: ${num(profile.weight)} kg · Tragkraft: ${num(profile.capacity)} kg</div>` + subnav('inventory', [['everyday', 'Geld und Alltag'], ['arsenal', 'Arsenal'], ['armor', 'Rüstungen'], ['animals', 'Tiere']], inventoryTab)
    + subpanel('inventory', 'everyday', inventoryTab, `<div class="pp-two-columns">${group('Geld', table(['Lagerort', 'Gold', 'Silber', 'Kupfer', 'Eisen'], (character.money ?? []).map((money, i) => `<tr>${['location', 'gold', 'silver', 'copper', 'iron'].map(key => `<td>${field(character, `money.${i}.${key}`, money[key], `${money.location} ${key}`, key === 'location' ? 'text' : 'number')}</td>`).join('')}</tr>`)))}<div>${equipment(character, ['Gegenstände'])}</div></div>`)
    + subpanel('inventory', 'arsenal', inventoryTab, `<div class="pp-two-columns"><div>${equipment(character, ['Nahkampfwaffen'])}</div><div>${equipment(character, ['Parierwaffen', 'Fernkampfwaffen', 'Munition'])}</div></div>`)
    + subpanel('inventory', 'armor', inventoryTab, equipment(character, ['Rüstungen']))
    + subpanel('inventory', 'animals', inventoryTab, equipment(character, ['Tiere']));
  return `<div class="pp-root" data-theme="${e(theme)}">${picker}<div class="pp-editor-header">
    ${group('Energien', ['LE', 'AE', 'KE'].map(name => { const i = character.resources.findIndex(x => x.name === name), stat = character.resources[i]; return `<div class="pp-energy ${stat ? '' : 'pp-inactive'}"><span>${name}</span>${stat ? field(character, `resources.${i}.value`, stat.value, `${name} aktuell`) + field(character, `resources.${i}.max`, stat.max, `${name} maximal`) : box(0) + box(0)}</div>`; }).join(''), 'pp-energies')}
    ${group('Willenskraft', field(character, 'profile.willpower', profile.willpower, 'Willenskraft aktuell') + field(character, 'profile.willpowerTotal', profile.willpowerTotal, 'Willenskraft gesamt'))}
    ${group('Abenteuerpunkte', `<div>${field(character, 'profile.apAvailable', profile.apAvailable, 'AP verfügbar')}${field(character, 'profile.apTotal', profile.apTotal, 'AP gesamt')}<small>Verfügbar / Gesamt</small></div>`)}
    ${group('Attributs-AP', field(character, 'profile.attributeAP', profile.attributeAP, 'Attributs-AP verfügbar') + field(character, 'profile.attributeAPTotal', profile.attributeAPTotal, 'Attributs-AP Progression'))}
    </div><div class="pp-status ${status.ready ? '' : 'pp-warning'}"><span>${e(status.message)}</span><span>${actor?.isOwner ? 'Besitzerzugriff' : 'Lesezugriff'}</span></div>
    ${character.editable ? `<div class="pp-edit-bar">${button('save', 'Änderungen speichern')}${button('discard', 'Änderungen verwerfen')}<span class="pp-save-status" role="status">Gespeichert. Änderungen an Werten mit Tab oder Klick außerhalb übernehmen.</span><small>AP-Kosten und weitere Regelableitungen bei manuellen Änderungen selbst anpassen.</small></div>` : ''}
    ${character.warnings.map(warning => `<p class="pp-warning">${e(warning)}</p>`).join('')}
    <nav class="pp-tabs" aria-label="Charakterbereiche">${MAIN_TABS.map(([id, label]) => button('tab', label, `data-tab="${id}" aria-pressed="${tab === id}"`)).join('')}</nav>
    ${panel('biography', biography(character))}${panel('attributes', attributes(character, disabled))}
    ${panel('advantages', `<div class="pp-two-columns">${group('Vorteile', detailTable(character, 'Vorteile', 'Vorteil'))}${group('Nachteile', detailTable(character, 'Nachteile', 'Nachteil'))}</div>`)}
    ${panel('conditions', `<div class="pp-two-columns">${group('Stufenlose Zustände', table(['Zustand', 'Aktiv'], (character.conditions?.simple ?? []).map((item, i) => `<tr><td>${e(item.name)}</td><td>${toggle(character, `conditions.simple.${i}.active`, item.active, `${item.name} aktiv`)}</td></tr>`)))}${group('Abgestufte Zustände', table(['Zustand', 'Stufe'], (character.conditions?.complex ?? []).map((item, i) => `<tr><td>${e(item.name)}</td><td>${field(character, `conditions.complex.${i}.level`, item.level, `${item.name} Stufe`)}</td></tr>`)))}</div>`)}
    ${panel('mundane', mundane)}${panel('magic', magic)}${panel('clerical', clerical)}${panel('inventory', inventory)}
    <footer class="pp-footer"><span>${token ? `Token: ${e(token.name)}` : 'Würfe für den gewählten Foundry-Charakter.'}</span>${button('token', 'Ausgewählten Token verknüpfen', actor?.isOwner ? '' : 'disabled')}<span>Import: ${e(Number.isNaN(date.getTime()) ? '' : date.toLocaleString('de-DE'))} · Änderungen in Foundry speichern. Ein erneuter Import ersetzt diese Werte.</span></footer></div>`;
}
export function renderImportOptions(actors, selectedId, canCreate) {
  return `<div class="pp-import"><label>Pedipalpus-Charakterdatei<input type="file" name="characterFile" accept=".json,application/json" required></label><p class="pp-import-preview">Bitte eine JSON-Datei auswählen.</p><label>In Foundry speichern als<select name="destination">${canCreate ? `<option value="" ${selectedId ? '' : 'selected'}>Neuen Charakter anlegen</option>` : ''}${actors.map(actor => `<option value="${e(actor.id)}" ${actor.id === selectedId ? 'selected' : ''}>${e(actor.name)}</option>`).join('')}</select></label><p>Beim erneuten Import wird das Pedipalpus-Blatt ersetzt. Token, Bild, Berechtigungen und vorhandene Foundry-Werte bleiben erhalten.</p></div>`;
}
