import { buildCommand } from './commands.js';
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const e = escapeHTML;
const number = value => Number.isSafeInteger(value) ? value.toLocaleString('de-DE') : '–';
export function mastery(check) {
  const value = check.value;
  if (check.kind === 'attribute') return {
    grade: value <= 1 ? 'untrained' : value < 8 ? 'novice' : value <= 12 ? 'trained' : value < 20 ? 'adept' : 'master',
    label: value <= 1 ? 'Sehr schwach' : value < 8 ? 'Schwach' : value <= 12 ? 'Durchschnittlich' : value < 20 ? 'Stark' : 'Meisterlich',
    progress: Math.max(0, Math.min(19, value - 1)) / 19, scale: 'attributes'
  };
  if (check.kind !== 'skill' || check.id?.startsWith('secondary:')) return { grade: 'attribute', label: check.kind === 'combat' ? 'Kampfwert' : 'Basiswert', progress: 0, scale: 'other' };
  return { grade: value <= 0 ? 'untrained' : value < 4 ? 'novice' : value < 7 ? 'trained' : value < 10 ? 'adept' : 'master',
    label: value <= 0 ? 'Ungeübt' : value < 4 ? 'Grundkenntnisse' : value < 7 ? 'Geübt' : value < 10 ? 'Versiert' : 'Meisterlich',
    progress: Math.max(0, Math.min(10, value)) / 10, scale: 'talents' };
}
const button = (action, label, extras = '') => `<button type="button" data-action="${action}" ${extras}>${label}</button>`;
export const CATEGORIES = [['all', 'Alle Proben'], ['attributes', 'Attribute'], ['combat', 'Kampf'], ['animals', 'Tierproben'], ['BodySkills', 'Körperlich'], ['SocialSkills', 'Sozial'], ['NatureSkills', 'Natur'], ['AcademicSkills', 'Akademisch'], ['CraftingSkills', 'Handwerklich'], ['HobbySkills', 'Freizeit'], ['magic', 'Magie'], ['Miracles', 'Klerikal']];
const categoryOf = check => {
  const key = check.id?.split(':')[0];
  return ['primary', 'secondary'].includes(key) ? 'attributes' : ['Spells', 'Rituals'].includes(key) ? 'magic' : key;
};
const validCombat = check => { try { buildCommand(check); return true; } catch { return false; } };
export function rollableChecks(character) {
  return (character?.checks ?? []).filter(check => check && !check.reason && typeof check.name === 'string' && Number.isSafeInteger(check.value)
    && (check.kind === 'attribute' || check.kind === 'combat' && validCombat(check) || check.kind === 'skill' && Array.isArray(check.attributes) && check.attributes.length === 3
      && check.attributes.every(att => att && typeof att.name === 'string' && Number.isSafeInteger(att.value))));
}
const probe = check => check.kind === 'combat' ? `<span class="pp-single-probe" title="${e(`Fertigkeit ${check.combat.skillValue} + Basis ${check.combat.baseValue} + Fokus ${check.combat.focusValue} + Waffenbonus ${check.combat.weaponModifier} − BE ${check.combat.mobilityPenalty}`)}">${{attack:'AT',parry:'PA',ranged:'FK'}[check.combat.type]} · 1W20</span>` : check.kind === 'attribute' ? '<span class="pp-single-probe">3W20</span>'
  : `<span class="pp-trio">${check.attributes.map(att => `<span title="${e(att.name)}">${e(att.short || att.name)} <strong>${number(att.value)}</strong></span>`).join('')}</span>`;
const rollButton = (check, disabled, reason, blind = false) => button('roll', `${blind ? '<span aria-hidden="true">?</span>' : ''}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 22 8v9l-10 5L2 17V8L12 2Zm0 0L7 10l5 12 5-12L12 2ZM2 8l5 2h10l5-2M2 17l5-7m15 7-5-7"/></svg>`,
  `class="pp-dice-button ${blind ? 'pp-blind-button' : ''}" data-check="${e(check.id)}" data-blind="${blind}" aria-label="${e(check.name)} ${blind ? 'verdeckt ' : ''}würfeln" title="${e(disabled ? reason : `${check.name} ${blind ? 'verdeckt würfeln – Ergebnis nur für Spielleiter' : 'würfeln'}`)}" ${disabled ? 'disabled' : ''}`);

export function renderView({ actors, actor, character, status, canImport, token, canLinkToken = false, search = '', category = 'all', theme = 'fantasy', modifier = 0, modifierDirection = 1 }) {
  const options = actors.map(item => `<option value="${e(item.id)}" ${item.id === actor?.id ? 'selected' : ''}>${e(item.name)}${item.hasCharacter ? '' : ' · noch kein Import'}</option>`).join('');
  const toolbar = `<div class="pp-toolbar"><label class="pp-picker">Charakter<select name="actor" aria-label="Foundry-Charakter"><option value="">Charakter auswählen …</option>${options}</select></label>${button('import', 'JSON importieren', `class="pp-import-button" ${canImport ? '' : 'disabled'}`)}${button('portrait', '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="8" cy="9" r="1.5"/><path d="m4 19 6-6 4 4 3-3 4 5"/></svg>', `class="pp-portrait-button" aria-label="Charakterbild importieren" title="Charakter- und Tokenbild importieren" ${actor?.isOwner ? '' : 'disabled'}`)}<label class="pp-theme">Darstellung<select name="theme" aria-label="Darstellung"><option value="fantasy" ${theme === 'fantasy' ? 'selected' : ''}>Fantasy</option><option value="dark" ${theme === 'dark' ? 'selected' : ''}>Dunkel</option><option value="light" ${theme === 'light' ? 'selected' : ''}>Hell</option></select></label></div>`;
  if (!character) return `<div class="pp-root" data-theme="${e(theme)}">${toolbar}<div class="pp-welcome"><i class="fa-solid fa-dice-d20" aria-hidden="true"></i><h2>Pedipalpus – Proben</h2><p>Charakterdatei importieren, eine Probe auswählen und würfeln.</p><p class="pp-hint">Einen vorhandenen Foundry-Charakter auswählen oder beim Import einen neuen anlegen.</p></div></div>`;
  const checks = rollableChecks(character);
  const available = new Set(checks.map(categoryOf));
  const disabled = !status.ready || status.directReady === false || !actor?.isOwner;
  const disabledReason = !actor?.isOwner ? 'Zum Würfeln werden Besitzerrechte benötigt.' : status.message;
  return `<div class="pp-root" data-theme="${e(theme)}">${toolbar}
    <div class="pp-filters"><label>Bereich<select name="category" aria-label="Probenbereich">${CATEGORIES.filter(([key]) => key === 'all' || available.has(key)).map(([key, label]) => `<option value="${key}" ${key === category ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label class="pp-search">Suche<input type="search" name="search" placeholder="Probe suchen …" aria-label="Fertigkeiten durchsuchen" value="${e(search)}"></label></div>
    <p class="pp-search-scope" ${search ? '' : 'hidden'}>Suche in allen Bereichen</p>
    <div class="pp-modifier"><label>Nächste Probe<input name="modifier" aria-label="${modifier < 0 || modifierDirection < 0 ? 'Erleichterung' : 'Erschwernis'}" title="Gilt für die nächste Probe, danach wieder 0" type="number" min="0" step="1" data-mode="${modifier === 0 ? 'neutral' : modifier < 0 ? 'relief' : 'difficulty'}" value="${e(Number.isSafeInteger(modifier) ? Math.abs(modifier) : '')}"></label><button type="button" name="modifierDirection" title="Zwischen Erschwernis und Erleichterung wechseln">${modifier < 0 || modifierDirection < 0 ? 'Erleichterung' : 'Erschwernis'}</button><span class="pp-wheel-hint"><span>↑ schwerer<br>↓ leichter</span><span>Mausrad</span></span></div>
    <div class="pp-check-list"><table class="pp-table"><thead><tr><th scope="col">Probe</th><th scope="col">Attribute</th><th scope="col" class="pp-value">Wert</th><th scope="col"><span class="pp-sr-only">Würfeln</span></th></tr></thead><tbody>${checks.map(check => {
      const foundation = check.foundation || check.group?.split(' · ').slice(1).join(' · ');
      const rank = mastery(check);
      const rowDisabled = disabled || check.kind === 'combat' && status.combatReady === false;
      const rowReason = !disabled && rowDisabled ? 'Kampfproben benötigen Ucurifunke – Proben ab 1.0.14.' : disabledReason;
      return `<tr class="pp-check-row" data-grade="${rank.grade}" data-scale="${rank.scale}" style="--pp-mastery:${rank.progress}" data-category="${e(categoryOf(check))}" data-search="${e(`${check.name} ${check.group || ''}`.toLocaleLowerCase('de'))}"><td><span class="pp-check-name">${rank.grade === 'master' ? '<span class="pp-master-star" aria-hidden="true">✦</span> ' : ''}${e(check.name)}</span><small>${e(foundation || check.group || '')}</small></td><td>${probe(check)}</td><td class="pp-value"><span class="pp-rating" title="${rank.label} · Wert ${number(check.value)}" aria-label="${rank.label}: Wert ${number(check.value)}">${number(check.value)}</span></td><td><div class="pp-roll-buttons">${rollButton(check, rowDisabled, rowReason)}${rollButton(check, rowDisabled, rowReason, true)}</div></td></tr>`;
    }).join('')}</tbody></table><p class="pp-no-results" hidden>Keine passende Probe gefunden.</p></div>
    <footer class="pp-footer">${character.combatSchemaVersion === 1 ? '' : '<span class="pp-hint">Für Kampf- und Tierproben die Charakterdatei erneut importieren.</span>'}<span class="pp-rank-legend" data-scale="talents"><span>Talente:</span><span>0 ungeübt</span><span>1–3 Grundlagen</span><span>4–6 geübt</span><span>7–9 versiert</span><span>✦ 10+ meisterlich</span></span><span class="pp-rank-legend" data-scale="attributes"><span>Attribute:</span><span>1 sehr schwach</span><span>10 durchschnittlich</span><span>✦ 20+ meisterlich</span></span><span class="pp-status ${status.ready ? '' : 'pp-warning'}">${e(status.message)}</span><span>${actor?.isOwner ? 'Besitzerzugriff' : 'Lesezugriff'} · ${token ? `Token: ${e(token.name)}` : `Sprecher: ${e(actor?.name || character.profile.name)}`}</span>${canLinkToken ? button('token', 'Ausgewählten Token verknüpfen') : ''}<span class="pp-hint">Werte in Pedipalpus ändern und die JSON-Datei erneut importieren.</span>${character.warnings.map(warning => `<span class="pp-warning">${e(warning)}</span>`).join('')}</footer></div>`;
}

export function renderImportOptions(actors, selectedId, canCreate) {
  return `<div class="pp-import"><label>Pedipalpus-Charakterdatei<input type="file" name="characterFile" accept=".json,application/json" required></label><p class="pp-import-preview">Bitte eine JSON-Datei auswählen.</p><label>In Foundry speichern als<select name="destination">${canCreate ? `<option value="" ${selectedId ? '' : 'selected'}>Neuen Charakter anlegen</option>` : ''}${actors.map(actor => `<option value="${e(actor.id)}" ${actor.id === selectedId ? 'selected' : ''}>${e(actor.name)}</option>`).join('')}</select></label><p class="pp-portrait-source">Optional ein Charakterbild auswählen.</p><label>Charakterbild (optional)<input type="file" name="portraitFile" accept=".png,.jpg,.jpeg,.bmp,.webp"></label><p class="pp-portrait-preview">Kein Bild ausgewählt. Vorhandene Foundry-Bilder bleiben erhalten.</p><p>Beim Import werden die Pedipalpus-Daten ersetzt. Mit Bildauswahl werden Charakterbild, Token-Vorlage und bearbeitbare verknüpfte Tokens aktualisiert. Berechtigungen und übrige Foundry-Werte bleiben erhalten.</p></div>`;
}
