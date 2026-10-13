import { buildCommand } from './commands.js';
import { characterFocus } from './combat.js';
import { uiText } from './language.js';
import { checkDisplayName } from './ork-talents.js';
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const e = escapeHTML;
const number = value => Number.isSafeInteger(value) ? value.toLocaleString('de-DE') : '–';
export function mastery(check) {
  const combatTalent = check.kind === 'combat' && !check.id?.startsWith('animals:');
  const value = combatTalent ? check.combat?.skillValue : check.value;
  if (check.kind === 'attribute') return {
    grade: value <= 1 ? 'untrained' : value < 8 ? 'novice' : value <= 12 ? 'trained' : value < 20 ? 'adept' : 'master',
    label: value <= 1 ? 'Sehr schwach' : value < 8 ? 'Schwach' : value <= 12 ? 'Durchschnittlich' : value < 20 ? 'Stark' : 'Meisterlich',
    progress: Math.max(0, Math.min(19, value - 1)) / 19, scale: 'attributes'
  };
  if (!Number.isSafeInteger(value) || !combatTalent && check.kind !== 'skill' || check.id?.startsWith('secondary:')) return { grade: 'attribute', label: check.kind === 'combat' ? 'Kampfwert' : 'Basiswert', progress: 0, scale: 'other' };
  return { grade: value <= 0 ? 'untrained' : value < 4 ? 'novice' : value < 7 ? 'trained' : value < 10 ? 'adept' : 'master',
    label: value <= 0 ? 'Ungeübt' : value < 4 ? 'Grundkenntnisse' : value < 7 ? 'Geübt' : value < 10 ? 'Versiert' : 'Meisterlich',
    progress: Math.max(0, Math.min(10, value)) / 10, scale: 'talents' };
}
const button = (action, label, extras = '') => `<button type="button" data-action="${action}" ${extras}>${label}</button>`;
export const CATEGORIES = [['all', 'Alle Proben'], ['favorites', 'Favoriten'], ['attributes', 'Attribute'], ['combat', 'Kampf'], ['animals', 'Tierproben'], ['BodySkills', 'Körperlich'], ['SocialSkills', 'Sozial'], ['NatureSkills', 'Natur'], ['AcademicSkills', 'Akademisch'], ['CraftingSkills', 'Handwerklich'], ['HobbySkills', 'Freizeit'], ['magic', 'Magie'], ['Miracles', 'Klerikal']];
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
export function checksForView(character, mode = 'full') {
  return rollableChecks(character).filter(check => mode === 'battle' ? check.kind === 'combat' : check.kind !== 'combat');
}
const probe = (check, theme = 'fantasy') => check.kind === 'combat' ? `<span class="pp-single-probe" title="${e(`${uiText(theme,'Fertigkeit')} ${check.combat.skillValue} + ${uiText(theme,'Basis')} ${check.combat.baseValue} + ${uiText(theme,'Fokus')} ${check.combat.focusValue} + ${uiText(theme,'Waffenbonus')} ${check.combat.weaponModifier} − BE ${check.combat.mobilityPenalty}`)}">${(theme === 'ork' ? {attack:'Hau',parry:'Block',ranged:'Weit'} : {attack:'AT',parry:'PA',ranged:'FK'})[check.combat.type]} · 1W20</span>` : check.kind === 'attribute' ? '<span class="pp-single-probe">3W20</span>'
  : `<span class="pp-trio">${check.attributes.map(att => `<span title="${e(att.name)}">${e(att.short || att.name)} <strong>${number(att.value)}</strong></span>`).join('')}</span>`;
const signed = value => value > 0 ? `+${value}` : String(value);
export function updateFocusView(content, character) {
  const root = content.querySelector('.pp-root');
  const theme = root?.dataset.language === 'ork' ? 'ork' : 'fantasy';
  const t = text => uiText(theme,text);
  const focus = characterFocus(character);
  const off = content.querySelector('[data-focus="off"]');
  const def = content.querySelector('[data-focus="def"]');
  if (off) off.textContent = `${t('OFF')} ${signed(focus)}`;
  if (def) def.textContent = `${t('DEF')} ${signed(-focus)}`;
  content.querySelector('[name="focus"]')?.setAttribute('aria-valuetext', `${t('OFF')} ${signed(focus)}, ${t('DEF')} ${signed(-focus)}`);
  const checks = new Map(character.checks.map(check => [check.id, check]));
  content.querySelectorAll('.pp-check-row').forEach(row => {
    const check = checks.get(row.dataset.checkId);
    if (check?.kind !== 'combat' || check.id.startsWith('animals:')) return;
    const ratingField = row.querySelector('.pp-rating');
    if (!ratingField) return;
    ratingField.textContent = number(check.value);
    const rating = `${t(mastery(check).label)} · ${t('Talentwert')} ${number(check.combat.skillValue)} · ${t('Probenwert')} ${number(check.value)}`;
    row.querySelector('.pp-rating').title = rating;
    row.querySelector('.pp-rating').setAttribute('aria-label', rating);
    const probeField = row.querySelector('.pp-single-probe');
    if (probeField) probeField.outerHTML = probe(check,theme);
  });
}
const rollButton = (check, disabled, reason, blind = false) => button('roll', `${blind ? '<span aria-hidden="true">?</span>' : ''}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 22 8v9l-10 5L2 17V8L12 2Zm0 0L7 10l5 12 5-12L12 2ZM2 8l5 2h10l5-2M2 17l5-7m15 7-5-7"/></svg>`,
  `class="pp-dice-button ${blind ? 'pp-blind-button' : ''}" data-check="${e(check.id)}" data-blind="${blind}" aria-label="${e(check.name)} ${blind ? 'verdeckt ' : ''}würfeln" title="${e(disabled ? reason : `${check.name} ${blind ? 'verdeckt würfeln – Ergebnis nur für Spielleiter' : 'würfeln'}`)}" ${disabled ? 'disabled' : ''}`);

const masteryFrame = `<svg class="pp-mastery-frame" aria-hidden="true" focusable="false" viewBox="0 0 48 38">
  <g fill="#b28a36" stroke="#805f22" stroke-width=".3">
    <path d="M10 33C2 27 1 17 6 5M38 33c8-6 9-16 4-28" fill="none" stroke-width=".8"/>
    <path d="M6 10C0 10 0 5 2 2c4 2 5 4 4 8M4 17c-6-1-6-5-4-8 4 2 6 5 4 8M5 24c-6 0-7-3-6-6 4 1 6 3 6 6M8 30c-6 2-8-1-8-4 4 0 7 1 8 4M6 13c6-1 7-5 6-8-4 1-6 4-6 8M5 21c6-1 7-4 6-7-4 1-6 3-6 7M7 28c5-2 6-5 4-7-3 2-4 4-4 7"/>
    <path d="M42 10c6 0 6-5 4-8-4 2-5 4-4 8M44 17c6-1 6-5 4-8-4 2-6 5-4 8M43 24c6 0 7-3 6-6-4 1-6 3-6 6M40 30c6 2 8-1 8-4-4 0-7 1-8 4M42 13c-6-1-7-5-6-8 4 1 6 4 6 8M43 21c-6-1-7-4-6-7 4 1 6 3 6 7M41 28c-5-2-6-5-4-7 3 2 4 4 4 7"/>
    <path d="m20 34 4-2 4 2-4 2z"/>
  </g>
</svg>`;

const categoryPaths = {
  all:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  attributes:'M12 3v18M3 12h18M5 5l14 14M5 19 19 5',
  combat:'M3 2l8 8-2 2-8-8zM5 11l-3 3m3-1 3 3M2 19l2 2 4-4M16 7l6 3v5c0 4-3 6-6 8-3-2-6-4-6-8v-5zM16 10v9',
  animals:'M7 12c-3-5-6-2-4 1m14-1c3-5 6-2 4 1M9 7c-2-6-5-3-3 1m9-1c2-6 5-3 3 1M6 18c0-7 12-7 12 0 0 4-4 1-6 1s-6 3-6-1Z',
  BodySkills:'m4 17 3-8 4 4 5-9m-7 9 5 5 5-4M13 3h1',
  SocialSkills:'M3 4h18v12H9l-5 4v-4H3zM7 8h10M7 12h6',
  NatureSkills:'M12 21V9M12 17c-9 0-9-9-9-9 8 0 9 6 9 6m0-2c0-8 9-9 9-9s0 10-9 12',
  AcademicSkills:'M3 5c3-2 6-2 9 0 3-2 6-2 9 0v15c-3-2-6-2-9 0-3-2-6-2-9 0zm9 0v15',
  CraftingSkills:'m3 20 10-10M13 10l-3-3 4-4 7 7-4 4zM3 20l2 1 9-9',
  HobbySkills:'M4 6h16v12H4zM8 10h1m6 4h1M8 14h1m6-4h1',
  magic:'m4 20 10-10M13 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1zm6 10 1 2 2 1-2 1-1 2-1-2-2-1 2-1z',
  Miracles:'M12 2v20M5 8h14M7 18l5 4 5-4',
  favorites:'m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  recent:'M4 7a9 9 0 1 1-1 8M4 3v5h5m3-1v6l4 2'
};
const categoryIcon = key => `<svg class="pp-category-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${categoryPaths[key] || categoryPaths.all}"/></svg>`;
const safePortrait = value => typeof value === 'string' && value && !/[\u0000-\u001f]/.test(value) && !/^(?:javascript|data|vbscript):/i.test(value.trim()) ? value : '';
const actionLabel = check => ({attack:'Angriff',parry:'Parade',ranged:'Fernkampf'})[check.combat?.type] || check.name;
const weaponKey = check => check.kind === 'combat' ? check.id.replace(/:(attack|parry|ranged)$/, '') : '';

export function renderView({ actors = [], actor, character, status = {}, canImport, token, canLinkToken = false, search = '', category = 'all', theme = 'fantasy', modifier = 0, modifierDirection = 1, busy = false, preferences = {}, administration = false, mode = 'full', favoriteKeys = [], recentKeys = [], checkKeys = {}, feedback = '', lastCheckId = '' }) {
  const density = ['compact','comfortable'].includes(preferences.density) ? preferences.density : 'normal';
  const language = preferences.language === 'normal' || preferences.language === 'standard' ? 'normal' : preferences.language === 'ork' || theme === 'ork' ? 'ork' : 'normal';
  const probeTheme = language === 'ork' ? 'ork' : 'fantasy';
  const keyOf = check => checkKeys[check.id] || check.id;
  const favorites = new Set(favoriteKeys);
  const recent = new Set(recentKeys);
  const isFavorite = check => favorites.has(keyOf(check));
  const isRecent = check => recent.has(keyOf(check));
  const frozen = busy ? 'disabled' : '';
  const options = actors.map(item => `<option value="${e(item.id)}" ${item.id === actor?.id ? 'selected' : ''}>${e(item.name)}${item.hasCharacter ? '' : ' · noch kein Import'}</option>`).join('');
  const image = safePortrait(actor?.img);
  const switches = mode === 'full'
    ? `${button('battle', categoryIcon('combat'), 'class="pp-mode-button" aria-label="Kampfbrett öffnen" title="Kampfbrett öffnen"')}${button('ring', categoryIcon('favorites'), 'class="pp-mode-button" aria-label="Probenring öffnen" title="Probenring öffnen"')}`
    : button('full', mode === 'ring' ? '<span aria-hidden="true">×</span>' : categoryIcon('all'), `class="pp-mode-button" aria-label="${mode === 'ring' ? 'Probenring schließen' : 'Zu den Proben wechseln'}" title="${mode === 'ring' ? 'Probenring schließen' : 'Zu den Proben wechseln'}"`);
  const toolbar = `<div class="pp-toolbar pp-play-toolbar">${image ? `<img class="pp-portrait-medallion" src="${e(image)}" alt="" loading="lazy">` : `<span class="pp-portrait-medallion pp-portrait-placeholder" aria-hidden="true">${categoryIcon('attributes')}</span>`}<label class="pp-picker"><span class="pp-sr-only">Charakter</span><select name="actor" aria-label="Foundry-Charakter" ${frozen}><option value="">Charakter auswählen …</option>${options}</select></label><div class="pp-tools">${switches}${button('administration', '<span aria-hidden="true">⚙</span>', `class="pp-mode-button" aria-label="Werkzeuge" title="Werkzeuge" aria-expanded="${administration || !character}" ${frozen}`)}</div></div>`;
  const admin = `<div class="pp-administration" ${administration || !character ? '' : 'hidden'}>${button('import', 'JSON importieren', `class="pp-import-button" ${canImport && !busy ? '' : 'disabled'}`)}${button('portrait', '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="8" cy="9" r="1.5"/><path d="m4 19 6-6 4 4 3-3 4 5"/></svg>', `class="pp-portrait-button" aria-label="Charakterbild importieren" title="Charakter- und Tokenbild importieren" ${actor?.isOwner && !busy ? '' : 'disabled'}`)}<label class="pp-theme"><span class="pp-sr-only">Darstellung</span><select name="theme" aria-label="Darstellung" ${frozen}>${[['fantasy','Fantasy'],['ork','Ork'],['dark','Dunkel'],['light','Hell']].map(([key,label])=>`<option value="${key}" ${theme === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label>${button('preferences', 'Einstellungen', frozen)}${button('presets', 'Vorlagen', frozen)}${button('export', 'Austauschpaket', actor?.isOwner && character?.sourceJSON && !busy ? '' : 'disabled')}${button('diagnostic', 'Versionsinformationen', frozen)}${canLinkToken ? button('token', 'Ausgewählten Token verknüpfen', frozen) : ''}</div>`;
  const openRoot = `<div class="pp-root" data-theme="${e(theme)}" data-density="${density}" data-language="${language}" data-mode="${e(mode)}" data-animations="${preferences.animations === false || preferences.animations === 'none' ? 'false' : 'true'}">`;
  const fixedStatus = `<div class="pp-feedback" role="status" aria-live="polite" aria-atomic="true">${e(feedback)}</div>`;
  if (!character) return `${openRoot}${toolbar}${admin}<div class="pp-welcome"><i class="fa-solid fa-dice-d20" aria-hidden="true"></i><h2>Pedipalpus – Proben</h2><p>Charakterdatei importieren, eine Probe auswählen und würfeln.</p><p class="pp-hint">Einen vorhandenen Foundry-Charakter auswählen oder beim Import einen neuen anlegen.</p></div>${fixedStatus}</div>`;
  const label = check => e(checkDisplayName(check, language));
  const original = check => language === 'ork' && check.kind === 'skill' ? `<small class="pp-original-name">${e(check.name)}</small>` : '';
  const allChecks = checksForView(character,mode);
  const checks = mode === 'ring' ? allChecks.filter(isFavorite).sort((a,b)=>favoriteKeys.indexOf(keyOf(a))-favoriteKeys.indexOf(keyOf(b))).slice(0,6) : allChecks;
  const available = new Set(checks.map(categoryOf));
  const disabled = busy || !status.ready || status.directReady === false || !actor?.isOwner;
  const disabledReason = !actor?.isOwner ? 'Zum Würfeln werden Besitzerrechte benötigt.' : status.message;
  const rankAttributes = check => {
    const rank = mastery(check);
    return `data-check-id="${e(check.id)}" data-ref-key="${e(keyOf(check))}" data-grade="${rank.grade}" data-scale="${rank.scale}" style="--pp-mastery:${rank.progress}" data-category="${e(categoryOf(check))}" data-search="${e(`${check.name} ${check.group || ''} ${checkDisplayName(check,'ork')}`.toLocaleLowerCase('de'))}" data-favorite="${isFavorite(check)}" data-recent="${isRecent(check)}" data-last="${lastCheckId === check.id}"`;
  };
  const favoriteButton = check => button('favorite', isFavorite(check) ? '★' : '☆', `class="pp-favorite-button" data-check="${e(check.id)}" aria-label="${e(check.name)} ${isFavorite(check) ? 'aus Favoriten entfernen' : 'zu Favoriten hinzufügen'}" title="${isFavorite(check) ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}" aria-pressed="${isFavorite(check)}" ${frozen}`);
  const rating = check => {
    const rank = mastery(check);
    const text = `${rank.label} · ${rank.scale === 'talents' && check.kind === 'combat' ? `Talentwert ${number(check.combat.skillValue)} · Probenwert` : 'Wert'} ${number(check.value)} · Berechnung ansehen`;
    const decoration=rank.grade==='master'?'master':rank.scale==='talents'?'lesser':'plain';
    return `<span class="pp-value-medallion" data-decoration="${decoration}">${decoration!=='plain' ? masteryFrame : ''}${button('breakdown', number(check.value), `class="pp-rating" data-check="${e(check.id)}" title="${e(text)}" aria-label="${e(text)}" ${frozen}`)}</span>`;
  };
  const rolls = check => {
    const rowDisabled = disabled || check.kind === 'combat' && status.combatReady === false;
    const reason = !disabled && rowDisabled ? 'Kampfproben benötigen Ucurifunke – Proben ab 1.0.14.' : disabledReason;
    return `<div class="pp-roll-buttons">${rollButton(check,rowDisabled,reason)}${rollButton(check,rowDisabled,reason,true)}</div>`;
  };
  const focus = characterFocus(character);
  const focusControl = mode === 'battle' && focus !== null && checks.some(check => check.kind === 'combat' && !check.id.startsWith('animals:') && check.combat.type !== 'ranged')
    ? `<div class="pp-focus" title="Nahkampffokus wird im Foundry-Charakter gespeichert. Ein erneuter JSON-Import übernimmt wieder den Fokus aus Pedipalpus."><span>Fokus</span><output data-focus="def">DEF ${signed(-focus)}</output><input name="focus" aria-label="Kampffokus" aria-valuetext="OFF ${signed(focus)}, DEF ${signed(-focus)}" type="range" min="-4" max="4" step="1" value="${focus}" ${!actor?.isOwner || busy ? 'disabled' : ''}><output data-focus="off">OFF ${signed(focus)}</output></div>` : '';
  const filters = mode === 'ring' ? '' : `<div class="pp-filters"><label><span class="pp-sr-only">Bereich</span><select name="category" aria-label="Probenbereich">${CATEGORIES.filter(([key]) => ['all','favorites'].includes(key) || available.has(key)).map(([key,label])=>`<option value="${key}" ${key===category?'selected':''}>${mode==='battle'?({all:'Alle Kampfproben',favorites:'Kampffavoriten'}[key]||label):label}</option>`).join('')}</select></label><label class="pp-search"><span class="pp-sr-only">Suche</span><input type="search" name="search" placeholder="${mode==='battle'?'Kampfprobe suchen …':'Probe suchen …'}" aria-label="${mode==='battle'?'Kampfproben durchsuchen':'Fertigkeiten durchsuchen'}" value="${e(search)}"></label></div><p class="pp-search-scope" ${search?'':'hidden'}>Suche in allen Bereichen</p>`;
  const modifierControl = `<div class="pp-modifier"><label><input name="modifier" aria-label="${modifier < 0 || modifierDirection < 0 ? 'Erleichterung' : 'Erschwernis'}" title="Gilt für die nächste Probe, danach wieder 0" type="number" min="0" step="1" data-mode="${modifier === 0 ? 'neutral' : modifier < 0 ? 'relief' : 'difficulty'}" value="${e(Number.isSafeInteger(modifier) ? Math.abs(modifier) : '')}" ${!actor?.isOwner || busy ? 'disabled' : ''}></label><button type="button" name="modifierDirection" title="Zwischen Erschwernis und Erleichterung wechseln" ${!actor?.isOwner || busy ? 'disabled' : ''}>${modifier < 0 || modifierDirection < 0 ? 'Erleichterung' : 'Erschwernis'}</button><span class="pp-wheel-hint"><span>↑ schwerer<br>↓ leichter</span><span>Mausrad</span></span></div>`;
  const presets = Array.isArray(preferences.presets) ? preferences.presets.filter(item=>item && typeof item.id==='string' && typeof item.label==='string' && Number.isSafeInteger(item.modifier)).slice(0,8) : [];
  const presetControl = presets.length ? `<div class="pp-preset-bar" aria-label="Modifikator-Vorlagen">${presets.map(item=>button('preset',e(item.label),`class="pp-preset-button" data-preset="${e(item.id)}" title="${e(item.label)} · ${item.modifier<0?'Erleichterung':'Erschwernis'} ${number(Math.abs(item.modifier))}" ${!actor?.isOwner || busy?'disabled':''}`)).join('')}</div>` : '';
  const favoriteChecks = allChecks.filter(isFavorite).sort((a,b)=>favoriteKeys.indexOf(keyOf(a))-favoriteKeys.indexOf(keyOf(b))).slice(0,6);
  const quickbar = mode === 'full' && favoriteChecks.length ? `<details class="pp-quickbar" ${preferences.quickbar === false ? '' : 'open'}><summary>${categoryIcon('favorites')} Schnellleiste</summary><div class="pp-quick-grid">${favoriteChecks.map(check=>`<div class="pp-quick-check" data-quick-check="${e(check.id)}"><span title="${e(check.name)}">${label(check)}</span>${original(check)}${rolls(check)}</div>`).join('')}</div></details>` : '';
  let list;
  if (mode === 'ring') {
    list = `<div class="pp-check-list pp-ring-list"><div class="pp-ring" data-count="${checks.length}">${checks.length ? button('full','↗','class="pp-ring-center" aria-label="Vollständiges Fenster öffnen" title="Vollständiges Fenster öffnen"') : ''}${checks.map((check,index)=>`<section class="pp-check-row pp-ring-card" ${rankAttributes(check).replace(/style="[^"]*"/,'')} style="--pp-mastery:${mastery(check).progress};--pp-position:${index};--pp-x:${Math.round(Math.sin(index*2*Math.PI/checks.length)*155)}px;--pp-y:${Math.round(-Math.cos(index*2*Math.PI/checks.length)*112)}px"><header>${categoryIcon(categoryOf(check))}<span class="pp-check-name" draggable="true" data-check="${e(check.id)}" title="${e(check.name)}">${label(check)}${original(check)}</span>${favoriteButton(check)}</header><div class="pp-ring-values">${probe(check,probeTheme)}${rating(check)}</div>${rolls(check)}</section>`).join('')}</div><p class="pp-no-results" ${checks.length?'hidden':''}>Keine passende Probe gefunden.</p>${checks.length?'':'<p class="pp-ring-help">Favoriten im vollständigen Fenster mit dem Stern auswählen.</p>'}</div>`;
  } else {
    const groups = new Map();
    checks.filter(check=>check.kind==='combat').forEach(check=>{ const key=weaponKey(check); if(!groups.has(key))groups.set(key,[]); groups.get(key).push(check); });
    const seen = new Set();
    const rows = checks.map(check=>{
      const rank=mastery(check);
      const foundation=check.foundation || check.group?.split(' · ').slice(1).join(' · ') || '';
      const group=weaponKey(check);
      let heading='';
      if(group && !seen.has(group)) {
        seen.add(group);
        heading=`<tr class="pp-weapon-header" data-weapon-group="${e(group)}" data-check-ids="${e(JSON.stringify(groups.get(group).map(item=>item.id)))}" data-category="${e(categoryOf(check))}"><th colspan="5">${categoryIcon(categoryOf(check))}<span>${e(check.combat.weaponName)}</span><small>${e(check.animalName ? check.animalName : `${foundation} · Talent ${number(check.combat.skillValue)}`)}</small></th></tr>`;
      }
      const title = group ? actionLabel(check) : checkDisplayName(check,language);
      const subtitle = group ? '' : language === 'ork' && check.kind === 'skill' ? check.name : foundation;
      return `${heading}<tr class="pp-check-row ${group?'pp-weapon-action':''}" ${rankAttributes(check)} ${group?`data-weapon-group="${e(group)}"`:''}><td class="pp-favorite-cell">${favoriteButton(check)}</td><td class="pp-name-cell"><span class="pp-check-name" draggable="true" data-check="${e(check.id)}">${group?'':categoryIcon(categoryOf(check))}${rank.grade==='master'?'<span class="pp-master-star" aria-hidden="true">✦</span> ':''}${e(title)}</span>${subtitle?`<small class="${language === 'ork' && check.kind === 'skill' ? 'pp-original-name' : ''}">${e(subtitle)}</small>`:''}</td><td>${probe(check,probeTheme)}</td><td class="pp-value">${rating(check)}</td><td>${rolls(check)}</td></tr>`;
    }).join('');
    list=`<div class="pp-check-list"><table class="pp-table"><thead><tr><th scope="col" class="pp-favorite-cell"><span class="pp-sr-only">Favoriten</span></th><th scope="col">Probe</th><th scope="col">Attribute</th><th scope="col" class="pp-value">Wert</th><th scope="col"><span class="pp-sr-only">Würfeln</span></th></tr></thead><tbody>${rows}</tbody></table><p class="pp-no-results" hidden>Keine passende Probe gefunden.</p></div>`;
  }
  return `${openRoot}${toolbar}${admin}${filters}${modifierControl}${presetControl}${focusControl}${quickbar}${list}${fixedStatus}</div>`;
}

export function renderImportOptions(actors, selectedId, canCreate) {
  return `<div class="pp-import"><label>Pedipalpus-Charakterdatei<input type="file" name="characterFile" accept=".json,.zip,application/json,application/zip" required></label><p class="pp-import-preview">Bitte eine JSON-Datei auswählen.</p><label>In Foundry speichern als<select name="destination">${canCreate ? `<option value="" ${selectedId ? '' : 'selected'}>Neuen Charakter anlegen</option>` : ''}${actors.map(actor => `<option value="${e(actor.id)}" ${actor.id === selectedId ? 'selected' : ''}>${e(actor.name)}</option>`).join('')}</select></label><p class="pp-portrait-source">Optional ein Charakterbild auswählen.</p><label>Charakterbild (optional)<input type="file" name="portraitFile" accept=".png,.jpg,.jpeg,.bmp,.webp"></label><p class="pp-portrait-preview">Kein Bild ausgewählt. Vorhandene Foundry-Bilder bleiben erhalten.</p><p>Beim Import werden die Pedipalpus-Daten ersetzt. Mit Bildauswahl werden Charakterbild, Token-Vorlage und bearbeitbare verknüpfte Tokens aktualisiert. Berechtigungen und übrige Foundry-Werte bleiben erhalten.</p></div>`;
}
