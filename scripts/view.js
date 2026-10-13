export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const e = escapeHTML;
const number = value => Number.isSafeInteger(value) ? value.toLocaleString('de-DE') : '–';
const button = (action, label, extras = '') => `<button type="button" data-action="${action}" ${extras}>${label}</button>`;
export const CATEGORIES = [['all', 'Alle Proben'], ['attributes', 'Attribute'], ['BodySkills', 'Körperlich'], ['SocialSkills', 'Sozial'], ['NatureSkills', 'Natur'], ['AcademicSkills', 'Akademisch'], ['CraftingSkills', 'Handwerklich'], ['HobbySkills', 'Freizeit'], ['magic', 'Magie'], ['Miracles', 'Klerikal']];
const categoryOf = check => {
  const key = check.id?.split(':')[0];
  return ['primary', 'secondary'].includes(key) ? 'attributes' : ['Spells', 'Rituals'].includes(key) ? 'magic' : key;
};
export function rollableChecks(character) {
  return (character?.checks ?? []).filter(check => check && !check.reason && typeof check.name === 'string' && Number.isSafeInteger(check.value)
    && (check.kind === 'attribute' || check.kind === 'skill' && Array.isArray(check.attributes) && check.attributes.length === 3
      && check.attributes.every(att => att && typeof att.name === 'string' && Number.isSafeInteger(att.value))));
}
const probe = check => check.kind === 'attribute' ? '<span class="pp-single-probe">3W20</span>'
  : `<span class="pp-trio">${check.attributes.map(att => `<span title="${e(att.name)}">${e(att.short || att.name)} <strong>${number(att.value)}</strong></span>`).join('')}</span>`;
const rollButton = (check, disabled, reason) => button('roll', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 22 8v9l-10 5L2 17V8L12 2Zm0 0L7 10l5 12 5-12L12 2ZM2 8l5 2h10l5-2M2 17l5-7m15 7-5-7"/></svg>',
  `class="pp-dice-button" data-check="${e(check.id)}" aria-label="${e(check.name)} würfeln" title="${e(disabled ? reason : `${check.name} würfeln`)}" ${disabled ? 'disabled' : ''}`);

export function renderView({ actors, actor, character, status, canImport, token, canLinkToken = false, search = '', category = 'all', theme = 'dark' }) {
  const options = actors.map(item => `<option value="${e(item.id)}" ${item.id === actor?.id ? 'selected' : ''}>${e(item.name)}${item.hasCharacter ? '' : ' · noch kein Import'}</option>`).join('');
  const toolbar = `<div class="pp-toolbar"><label class="pp-picker">Charakter<select name="actor" aria-label="Foundry-Charakter"><option value="">Charakter auswählen …</option>${options}</select></label>${button('import', 'JSON importieren', `class="pp-import-button" ${canImport ? '' : 'disabled'}`)}<label class="pp-theme">Darstellung<select name="theme" aria-label="Darstellung"><option value="dark" ${theme === 'dark' ? 'selected' : ''}>Dunkel</option><option value="light" ${theme === 'light' ? 'selected' : ''}>Hell</option></select></label></div>`;
  if (!character) return `<div class="pp-root" data-theme="${e(theme)}">${toolbar}<div class="pp-welcome"><i class="fa-solid fa-dice-d20" aria-hidden="true"></i><h2>Pedipalpus – Proben</h2><p>Charakterdatei importieren, eine Probe auswählen und würfeln.</p><p class="pp-hint">Einen vorhandenen Foundry-Charakter auswählen oder beim Import einen neuen anlegen.</p></div></div>`;
  const checks = rollableChecks(character);
  const available = new Set(checks.map(categoryOf));
  const disabled = !status.ready || !actor?.isOwner;
  const disabledReason = !actor?.isOwner ? 'Zum Würfeln werden Besitzerrechte benötigt.' : status.message;
  return `<div class="pp-root" data-theme="${e(theme)}">${toolbar}
    <div class="pp-filters"><label>Bereich<select name="category" aria-label="Probenbereich">${CATEGORIES.filter(([key]) => key === 'all' || available.has(key)).map(([key, label]) => `<option value="${key}" ${key === category ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label class="pp-search">Suche<input type="search" name="search" placeholder="Probe suchen …" aria-label="Fertigkeiten durchsuchen" value="${e(search)}"></label></div>
    <p class="pp-search-scope" ${search ? '' : 'hidden'}>Suche in allen Bereichen</p>
    <div class="pp-check-list"><table class="pp-table"><thead><tr><th scope="col">Probe</th><th scope="col">Attribute</th><th scope="col" class="pp-value">Wert</th><th scope="col"><span class="pp-sr-only">Würfeln</span></th></tr></thead><tbody>${checks.map(check => {
      const foundation = check.foundation || check.group?.split(' · ').slice(1).join(' · ');
      return `<tr class="pp-check-row" data-category="${e(categoryOf(check))}" data-search="${e(`${check.name} ${check.group || ''}`.toLocaleLowerCase('de'))}"><td><span class="pp-check-name">${e(check.name)}</span><small>${e(foundation || check.group || '')}</small></td><td>${probe(check)}</td><td class="pp-value">${number(check.value)}</td><td>${rollButton(check, disabled, disabledReason)}</td></tr>`;
    }).join('')}</tbody></table><p class="pp-no-results" hidden>Keine passende Probe gefunden.</p></div>
    <footer class="pp-footer"><span class="pp-status ${status.ready ? '' : 'pp-warning'}">${e(status.message)}</span><span>${actor?.isOwner ? 'Besitzerzugriff' : 'Lesezugriff'} · ${token ? `Token: ${e(token.name)}` : `Sprecher: ${e(actor?.name || character.profile.name)}`}</span>${canLinkToken ? button('token', 'Ausgewählten Token verknüpfen') : ''}<span class="pp-hint">Werte in Pedipalpus ändern und die JSON-Datei erneut importieren.</span>${character.warnings.map(warning => `<span class="pp-warning">${e(warning)}</span>`).join('')}</footer></div>`;
}

export function renderImportOptions(actors, selectedId, canCreate) {
  return `<div class="pp-import"><label>Pedipalpus-Charakterdatei<input type="file" name="characterFile" accept=".json,application/json" required></label><p class="pp-import-preview">Bitte eine JSON-Datei auswählen.</p><label>In Foundry speichern als<select name="destination">${canCreate ? `<option value="" ${selectedId ? '' : 'selected'}>Neuen Charakter anlegen</option>` : ''}${actors.map(actor => `<option value="${e(actor.id)}" ${actor.id === selectedId ? 'selected' : ''}>${e(actor.name)}</option>`).join('')}</select></label><p>Beim erneuten Import werden die Pedipalpus-Daten ersetzt. Token, Bild, Berechtigungen und vorhandene Foundry-Werte bleiben erhalten.</p></div>`;
}
