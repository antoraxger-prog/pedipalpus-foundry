import { COMPANION_GROUPS,isCompanionCheck } from './retinue.js';
import { buildCommand } from './commands.js';
import { tokenStyles, customFrameFor, savedFrames } from './tokens.js';
import { companionKey,companionEntries,companionActor,companionImportTargets } from './companions.js';
import { armorItems } from './equipment.js';
import { characterFocus } from './combat.js';
import { uiText } from './language.js';
import { checkDisplayName,orkTalentName } from './ork-talents.js';
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const e = escapeHTML;
const number = value => Number.isSafeInteger(value) ? value.toLocaleString('de-DE') : '–';
export function mastery(check) {
  const combatTalent = check.kind === 'combat' && !isCompanionCheck(check) && !check.fixedCombat;
  if(check.npcChoice&&!check.id.startsWith('NpcDerived:')||check.npcRules&&check.companionAbility&&!check.id.includes(':resistance:'))return {grade:check.value>=16?'master':check.value>=12?'adept':check.value>=8?'trained':'novice',label:({4:'Amateur',8:'Lehrling',12:'Geselle',16:'Meister',20:'Legende'})[check.value]??'Probenwert',progress:Math.max(0,Math.min(20,check.value))/20,scale:'npc'};
  const value = combatTalent ? check.combat?.skillValue : check.value;
  if (check.kind === 'attribute') return {
    grade: value <= 1 ? 'untrained' : value < 8 ? 'novice' : value <= 12 ? 'trained' : value < 20 ? 'adept' : 'master',
    label: value <= 1 ? 'Sehr schwach' : value < 8 ? 'Schwach' : value <= 12 ? 'Durchschnittlich' : value < 20 ? 'Stark' : 'Meisterlich',
    progress: Math.max(0, Math.min(19, value - 1)) / 19, scale: 'attributes'
  };
  if (!Number.isSafeInteger(value) || !combatTalent && check.kind !== 'skill' || check.id?.startsWith('secondary:') || check.id?.startsWith('NpcDerived:') || isCompanionCheck(check)&&check.id.includes(':resistance:')) return { grade: 'attribute', label: check.kind === 'combat' ? 'Kampfwert' : 'Basiswert', progress: 0, scale: 'other' };
  const ceiling = combatTalent ? 20 : 10;
  return { grade: value <= 0 ? 'untrained' : value < 4 ? 'novice' : value < 7 ? 'trained' : value < ceiling ? 'adept' : 'master',
    label: value <= 0 ? 'Ungeübt' : value < 4 ? 'Grundkenntnisse' : value < 7 ? 'Geübt' : value < ceiling ? 'Versiert' : 'Meisterlich',
    progress: Math.max(0, Math.min(ceiling, value)) / ceiling, scale: 'talents' };
}
const button = (action, label, extras = '') => `<button type="button" data-action="${action}" ${extras}>${label}</button>`;
export const CATEGORIES = [['all', 'Alle Proben'], ['favorites', 'Favoriten'], ['attributes', 'Attribute'], ['combat', 'Kampf'], ['animals', 'Tierproben'], ['demons','Dämonen'], ['undead','Untote'], ['chimeras','Chimären'], ['persons','Personen'], ['elementals','Elementare'], ['golems','Golems'], ['NpcAbilities','Fähigkeiten'], ['NpcFeatures','Merkmale'], ['armors', 'Rüstungen'], ['BodySkills', 'Körperlich'], ['SocialSkills', 'Sozial'], ['NatureSkills', 'Natur'], ['AcademicSkills', 'Akademisch'], ['CraftingSkills', 'Handwerklich'], ['HobbySkills', 'Freizeit'], ['magic', 'Magie'], ['Miracles', 'Klerikal']];
const categoryOf = check => {
  const key = check.id?.split(':')[0];
  return key==='NpcDerived'?'attributes':['primary', 'secondary'].includes(key) ? 'attributes' : ['Spells', 'Rituals'].includes(key) ? 'magic' : key;
};
const validCombat = check => { try { buildCommand(check); return true; } catch { return false; } };
export function rollableChecks(character) {
  return (character?.checks ?? []).filter(check => check && !check.reason && typeof check.name === 'string' && Number.isSafeInteger(check.value)
    && ((check.companionAbility||check.npcChoice) && check.needsAttributes || check.kind === 'attribute' || check.kind === 'combat' && validCombat(check) || check.kind === 'skill' && Array.isArray(check.attributes) && check.attributes.length === 3
      && check.attributes.every(att => att && typeof att.name === 'string' && Number.isSafeInteger(att.value))));
}
export function checksForView(character, mode = 'full') {
  return rollableChecks(character).filter(check => mode === 'battle' ? check.kind === 'combat'||isCompanionCheck(check) : check.kind !== 'combat'&&!isCompanionCheck(check));
}
const probe = (check, theme = 'fantasy') => check.kind === 'combat' ? `<span class="pp-single-probe" title="${e(`${uiText(theme,'Fertigkeit')} ${check.combat.skillValue} + ${uiText(theme,'Basis')} ${check.combat.baseValue} + ${uiText(theme,'Fokus')} ${check.combat.focusValue} + ${uiText(theme,'Waffenbonus')} ${check.combat.weaponModifier} − BE ${check.combat.mobilityPenalty}`)}">${(theme === 'ork' ? {attack:'Hau',parry:'Block',ranged:'Weit'} : {attack:'AT',parry:'PA',ranged:'FK'})[check.combat.type]} · 1W20</span>` : check.kind === 'attribute' ? '<span class="pp-single-probe">3W20</span>'
  : check.needsAttributes?`<span class="pp-single-probe">${e(uiText(theme,'Attribute wählen …'))}</span>`: `<span class="pp-trio">${check.attributes.map(att => `<span title="${e(att.name)}">${e(att.short || att.name)} <strong>${number(att.value)}</strong></span>`).join('')}</span>`;
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
    if (check?.kind !== 'combat' || isCompanionCheck(check) || check.fixedCombat) return;
    const ratingField = row.querySelector('.pp-rating');
    if (!ratingField) return;
    ratingField.textContent = number(check.value);
    ratingField.closest('.pp-value-medallion')?.setAttribute('data-zero',String(check.value===0));
    const rating = `${t(mastery(check).label)} · ${t('Talentwert')} ${number(check.combat.skillValue)} · ${t('Probenwert')} ${number(check.value)}`;
    row.querySelector('.pp-rating').title = rating;
    row.querySelector('.pp-rating').setAttribute('aria-label', `${check.name} würfeln · ${rating}`);
    const probeField = row.querySelector('.pp-single-probe');
    if (probeField) probeField.outerHTML = probe(check,theme);
  });
}
const rollButton = (check, disabled, reason, blind = false) => button('roll', `${blind ? '<svg class="pp-blind-eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3 21 21M9 5c6-2 10 4 12 7l-3 4M6 6c-2 2-4 4-5 6 3 5 8 8 13 6M10 10a3 3 0 0 0 4 4"/></svg>' : ''}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 22 8v9l-10 5L2 17V8L12 2Zm0 0L7 10l5 12 5-12L12 2ZM2 8l5 2h10l5-2M2 17l5-7m15 7-5-7"/></svg>`,
  `class="pp-dice-button ${blind ? 'pp-blind-button' : ''}" data-check="${e(check.id)}" data-blind="${blind}" aria-label="${e(check.name)} ${blind ? 'verdeckt ' : ''}würfeln" title="${e(disabled ? reason : `${check.name} ${blind ? 'verdeckt würfeln – Ergebnis nur für Spielleiter' : 'würfeln'}`)}" ${disabled ? 'disabled' : ''}`);

const infernalBackground = `<div class="pp-infernal-background" aria-hidden="true"><svg viewBox="0 0 100 100" focusable="false">
  <defs><filter id="pp-fire-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4"/></filter><linearGradient id="pp-fire-color" x2="1" y2="1"><stop stop-color="#ffba5f"/><stop offset=".4" stop-color="#d44620"/><stop offset=".7" stop-color="#ff8e36"/><stop offset="1" stop-color="#8d251d"/></linearGradient></defs>
  <g class="pp-infernal-glow" fill="none" stroke="url(#pp-fire-color)"><g filter="url(#pp-fire-glow)" stroke-width="2.8"><circle cx="50" cy="50" r="42"/><path d="M50 89 27 18 87 62 13 62 73 18Z"/></g><circle cx="50" cy="50" r="42" stroke-width=".45"/><path d="M50 89 27 18 87 62 13 62 73 18Z" stroke-width=".55"/><circle cx="50" cy="50" r="45" stroke-width=".3" stroke-dasharray="1 2"/></g>
  <g class="pp-infernal-fire" fill="none" stroke="url(#pp-fire-color)" stroke-linecap="round"><circle cx="50" cy="50" r="43" stroke-width="1.3" stroke-dasharray="4 10 2 13 6 8"/><path d="M49 6q-4-4 0-5M70 11q4-3 1-7M88 27q6-1 4-7M93 49q7-2 5-5M88 70q7 1 6-5M69 88q4 7 7 2M48 93q-3 7 3 6M27 87q-6 3-4 8M11 69q-7 2-4 7M7 48q-7-4-5 2M11 26q-6-1-7 4M28 11q-5-5-7-1" stroke-width=".65"/></g>
</svg></div>`;

const aristocratBackground = `<div class="pp-aristocrat-ornaments" aria-hidden="true"><svg viewBox="0 0 600 600" focusable="false"><defs><linearGradient id="pp-royal-metal"><stop stop-color="#815018"/><stop offset=".25" stop-color="#ffefab"/><stop offset=".5" stop-color="#ae7320"/><stop offset=".75" stop-color="#fff9d2"/><stop offset="1" stop-color="#8c5c1b"/></linearGradient></defs><g class="pp-royal-filigree" fill="none" stroke="url(#pp-royal-metal)" stroke-width="2"><rect x="12" y="12" width="576" height="576" rx="35"/><rect x="23" y="23" width="554" height="554" rx="27"/><path d="M40 120C120 120 120 40 40 40c0 65 55 70 55 35s-40-20-20 0M560 120c-80 0-80-80 0-80 0 65-55 70-55 35s40-20 20 0M40 480c80 0 80 80 0 80 0-65 55-70 55-35s-40 20-20 0M560 480c-80 0-80 80 0 80 0-65-55-70-55-35s40 20 20 0M200 30q50 70 100 0 50 70 100 0M200 570q50-70 100 0 50-70 100 0"/><circle cx="300" cy="300" r="172" stroke-width=".6"/><circle cx="300" cy="300" r="181" stroke-dasharray="2 5"/></g><g class="pp-royal-jewels" stroke="#e0bc66" stroke-width="3"><path fill="#6b1429" d="m300 27 12 16-12 16-12-16zM300 541l12 16-12 16-12-16z"/><path fill="#163d76" d="m27 300 16-12 16 12-16 12zM541 300l16-12 16 12-16 12z"/></g><g class="pp-royal-sparkles" fill="#fff4c8"><path d="m65 62 3 9 9 3-9 3-3 9-3-9-9-3 9-3zM530 510l3 9 9 3-9 3-3 9-3-9-9-3 9-3zM330 43l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></g></svg></div>`;

const royalCrest = `<div class="pp-royal-crest" aria-hidden="true"><span class="pp-cut-gem pp-ruby"></span><span class="pp-silver-flourish">❧</span><span class="pp-cut-gem pp-sapphire"></span><svg viewBox="0 0 60 26" focusable="false"><path fill="#d5aa50" stroke="#886025" d="m4 7 13 7L30 2l13 12 13-7-4 16H8z"/><path stroke="#fff4ba" fill="none" d="M10 20h40"/><path fill="#8d1533" stroke="#ffe9a7" d="m30 9 4 4-4 4-4-4z"/></svg><span class="pp-cut-gem pp-emerald"></span><span class="pp-silver-flourish">❧</span><span class="pp-cut-gem pp-ruby"></span></div>`;

const themedBackground = {
 warrior: `<div class="pp-material-ornament pp-warrior-ornament" aria-hidden="true"><svg viewBox="0 0 500 500" focusable="false"><g fill="none" stroke="#bdc3c6" stroke-width="7" opacity=".35"><path d="M90 45 345 320l-20 20L60 70Z M55 110l60-60M30 142l50-55M410 45 155 320l20 20L440 70Z M445 110l-60-60M470 142l-50-55"/></g><path d="M250 145 350 180v100c0 75-55 105-100 135-45-30-100-60-100-135V180Z" fill="#43474c" stroke="#bcc3c5" stroke-width="4"/><path d="M250 165v220M167 255h166" fill="none" stroke="#8a9396" stroke-width="10"/><g fill="#c3c8ca" stroke="#31383c"><circle cx="170" cy="191" r="5"/><circle cx="330" cy="191" r="5"/><circle cx="177" cy="297" r="5"/><circle cx="323" cy="297" r="5"/><circle cx="250" cy="394" r="5"/></g></svg></div>`,
 arcane: `<div class="pp-material-ornament pp-arcane-ornament" aria-hidden="true"><svg viewBox="0 0 500 500" focusable="false"><g class="pp-rune-orbit" fill="none" stroke="#8fd6ff"><circle cx="250" cy="250" r="202" stroke-width="2"/><circle cx="250" cy="250" r="182" stroke-width="1"/><circle cx="250" cy="250" r="192" stroke-width="9" stroke-dasharray="2 18"/><path d="m250 52 172 297H78Z M250 448 78 151h344Z" stroke-width="1.4"/><path d="m250 78 10 18-10 18-10-18zM78 250l18-10 18 10-18 10zM386 250l18-10 18 10-18 10zM250 386l10 18-10 18-10-18z" stroke-width="2"/></g><g class="pp-arcane-core" fill="none" stroke="#b091fc"><circle cx="250" cy="250" r="95" stroke-width="3"/><path d="m250 125 125 125-125 125-125-125zM210 210h80v80h-80z" stroke-width="2"/></g><g class="pp-arcane-motes" fill="#d2efff"><circle cx="145" cy="100" r="2"/><circle cx="340" cy="115" r="3"/><circle cx="375" cy="337" r="2"/><circle cx="119" cy="354" r="3"/><circle cx="215" cy="414" r="2"/></g></svg></div>`,
 sneaky: `<div class="pp-material-ornament pp-sneaky-ornament" aria-hidden="true"><svg viewBox="0 0 500 500" focusable="false"><defs><clipPath id="pp-acid-clip"><path d="M200 337h100v50c0 20-100 20-100 0Z"/></clipPath></defs><g class="pp-poison-glow"><path d="M217 252h66v30l22 36v69c0 27-110 27-110 0v-69l22-36Z" fill="#152210" stroke="#61933e" stroke-width="3"/><path d="M200 345q55-18 100 0v42c0 20-100 20-100 0Z" fill="#6bad29" opacity=".35"/><path d="M218 244h64v17h-64z" fill="#574433" stroke="#847054"/><g clip-path="url(#pp-acid-clip)" fill="none" stroke="#acd871" stroke-width="2"><g class="pp-acid-bubbles"><circle cx="222" cy="380" r="5"/><circle cx="255" cy="389" r="3"/><circle cx="283" cy="375" r="4"/></g><g class="pp-acid-bubbles pp-acid-bubbles-late"><circle cx="234" cy="385" r="3"/><circle cx="270" cy="392" r="6"/></g><path class="pp-acid-surface" d="M202 345q23-8 48 0t48 0"/></g><path d="m233 367 34-15m-32 0 32 15" stroke="#7faa44" stroke-width="3"/></g></svg></div>`
};

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
  combat:'M3 2h4l12 13-4 4L3 6V2Zm18 0h-4L5 15l4 4L21 6V2ZM3 14l7 7m4-7 7 7M3 21l4-4m10 0 4 4',
  demons:'M4 3l3 6h10l3-6v12l-8 7-8-7ZM8 13h1m6 0h1M9 17h6',
  undead:'M5 12V9a7 7 0 0 1 14 0v3l-3 3v5H8v-5ZM8 9h2m4 0h2M10 16v4m4-4v4',
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
const categoryIcon = key => `<svg class="pp-category-icon" data-category="${e(key)}" viewBox="0 0 24 24" aria-hidden="true"><path d="${categoryPaths[key] || categoryPaths.all}"/></svg>`;
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
  const options = actors.map(item => `<option value="${e(item.id)}" ${item.id === actor?.id ? 'selected' : ''}>${e(item.name)}${item.npc?' [NSC]':''}${item.hasCharacter ? '' : ' · noch kein Import'}</option>`).join('');
  const image = safePortrait(actor?.getFlag?.('pedipalpus-foundry','portraitFraming')?actor?.prototypeToken?.texture?.src:actor?.img)||safePortrait(actor?.img);
  const portraitMarkup=image?`<img class="pp-portrait-medallion" src="${e(image)}" alt="" loading="lazy">`:`<span class="pp-portrait-medallion pp-portrait-placeholder" aria-hidden="true">${categoryIcon('attributes')}</span>`;
  const switches = character?.profile?.companionGroup?'':mode === 'full'
    ? `${button('battle', categoryIcon('combat'), 'class="pp-mode-button" aria-label="Kampfbrett öffnen" title="Kampfbrett öffnen"')}${button('ring', categoryIcon('favorites'), 'class="pp-mode-button" aria-label="Probenring öffnen" title="Probenring öffnen"')}`
    : button('full', mode === 'ring' ? '<span aria-hidden="true">×</span>' : categoryIcon('all'), `class="pp-mode-button" aria-label="${mode === 'ring' ? 'Probenring schließen' : 'Zu den Proben wechseln'}" title="${mode === 'ring' ? 'Probenring schließen' : 'Zu den Proben wechseln'}"`);
  const toolbar = `<div class="pp-toolbar pp-play-toolbar">${actor?.isOwner?button('portrait-edit',portraitMarkup,`class="pp-portrait-trigger" aria-label="Bildausschnitt bearbeiten" title="Bildausschnitt bearbeiten" ${frozen}`):portraitMarkup}<label class="pp-picker"><span class="pp-sr-only">Charakter</span><select name="actor" aria-label="Foundry-Charakter" ${frozen}><option value="">Charakter auswählen …</option>${options}</select></label><div class="pp-tools">${switches}${button('administration', '<span aria-hidden="true">⚙</span>', `class="pp-mode-button" aria-label="Werkzeuge" title="Werkzeuge" aria-expanded="${administration || !character}" ${frozen}`)}</div></div>`;
  const admin = `<div class="pp-administration" ${administration || !character ? '' : 'hidden'}>${button('import', 'JSON importieren', `class="pp-import-button" ${canImport && !busy ? '' : 'disabled'}`)}${button('refresh', 'Aktualisieren', `${actor?.isOwner && character?.sourceJSON && !busy ? '' : 'disabled'}`)}${button('portrait', '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="8" cy="9" r="1.5"/><path d="m4 19 6-6 4 4 3-3 4 5"/></svg>', `class="pp-portrait-button" aria-label="Charakterbild importieren" title="Charakter- und Tokenbild importieren" ${actor?.isOwner && !busy ? '' : 'disabled'}`)}<label class="pp-theme"><span class="pp-sr-only">Darstellung</span><select name="theme" aria-label="Darstellung" ${frozen}>${[['fantasy','Fantasy'],['ork','Ork'],['demonic','Dämonisch'],['aristocrat','Aristocrat'],['warrior','Krieger'],['arcane','Magie'],['sneaky','Alchemy'],['dark','Dunkel'],['light','Hell']].map(([key,label])=>`<option value="${key}" ${theme === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label>${button('preferences', 'Einstellungen', frozen)}${button('export', 'Austauschpaket', actor?.isOwner && character?.sourceJSON && !busy ? '' : 'disabled')}${button('diagnostic', 'Versionsinformationen', frozen)}${canLinkToken ? button('token', 'Ausgewählten Token verknüpfen', frozen) : ''}</div>`;
  const openRoot = `<div class="pp-root" data-theme="${e(theme)}" data-density="${density}" data-language="${language}" data-mode="${e(mode)}" data-animations="${preferences.animations === false || preferences.animations === 'none' ? 'false' : 'true'}">${theme==='demonic'?infernalBackground:theme==='aristocrat'?aristocratBackground+royalCrest:themedBackground[theme]||''}`;
  const fixedStatus = `<div class="pp-feedback" role="status" aria-live="polite" aria-atomic="true">${e(feedback)}</div>`;
  if (!character) return `${openRoot}${toolbar}${admin}<div class="pp-welcome"><i class="fa-solid fa-dice-d20" aria-hidden="true"></i><h2>Pedipalpus – Proben</h2><p>Charakterdatei importieren, eine Probe auswählen und würfeln.</p><p class="pp-hint">Einen vorhandenen Foundry-Charakter auswählen oder beim Import einen neuen anlegen.</p></div>${fixedStatus}</div>`;
  const label = check => e(checkDisplayName(check, language));
  const original = check => language === 'ork' && ['skill','attribute'].includes(check.kind) ? `<small class="pp-original-name">${e(check.name)}</small>` : '';
  const allChecks = checksForView(character,mode);
  const checks = mode === 'ring' ? allChecks.filter(isFavorite).sort((a,b)=>favoriteKeys.indexOf(keyOf(a))-favoriteKeys.indexOf(keyOf(b))).slice(0,6) : allChecks;
  const available = new Set(checks.map(categoryOf));
  if(mode==='battle'){available.add('armors');for(const [collection,group] of COMPANION_GROUPS)if(character.equipment?.some(item=>item.id.startsWith(`${collection}:`)))available.add(group);}
  const disabled = busy || !status.ready || status.directReady === false || !actor?.isOwner;
  const disabledReason = !actor?.isOwner ? 'Zum Würfeln werden Besitzerrechte benötigt.' : status.message;
  const rollDisabled = check => disabled || check.kind === 'combat' && status.combatReady === false;
  const nameButton = (check,markup) => button('roll',markup,`class="pp-check-name" draggable="true" data-check="${e(check.id)}" data-blind="false" aria-label="${e(check.name)} durch Anklicken würfeln" title="${e(check.name)} würfeln" ${rollDisabled(check)?'disabled':''}`);
  const rankAttributes = check => {
    const rank = mastery(check);
    return `data-check-id="${e(check.id)}" data-ref-key="${e(keyOf(check))}" data-grade="${rank.grade}" data-scale="${rank.scale}" style="--pp-mastery:${rank.progress}" data-category="${e(categoryOf(check))}" data-search="${e(`${check.name} ${check.group || ''} ${checkDisplayName(check,'ork')}`.toLocaleLowerCase('de'))}" data-favorite="${isFavorite(check)}" data-recent="${isRecent(check)}" data-last="${lastCheckId === check.id}"`;
  };
  const favoriteButton = check => button('favorite', isFavorite(check) ? '★' : '☆', `class="pp-favorite-button" data-check="${e(check.id)}" aria-label="${e(check.name)} ${isFavorite(check) ? 'aus Favoriten entfernen' : 'zu Favoriten hinzufügen'}" title="${isFavorite(check) ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}" aria-pressed="${isFavorite(check)}" ${frozen}`);
  const rating = check => {
    const rank = mastery(check);
    const text = `${rank.label} · ${rank.scale === 'talents' && check.kind === 'combat' ? `Talentwert ${number(check.combat.skillValue)} · Probenwert` : 'Wert'} ${number(check.value)} · Würfeln`;
    const decoration=rank.grade==='master'?'master':'plain';
    return `<span class="pp-value-medallion" data-decoration="${decoration}" data-zero="${check.value===0}">${decoration!=='plain' ? masteryFrame : ''}${button('roll', number(check.value), `class="pp-rating" data-check="${e(check.id)}" data-blind="false" title="${e(text)}" aria-label="${e(check.name)} würfeln · ${e(text)}" ${rollDisabled(check)?'disabled':''}`)}</span>`;
  };
  const rolls = check => {
    const rowDisabled = rollDisabled(check);
    const reason = !disabled && rowDisabled ? 'Kampfproben benötigen Ucurifunke – Proben ab 1.0.14.' : disabledReason;
    return `<div class="pp-roll-buttons">${rollButton(check,rowDisabled,reason)}${rollButton(check,rowDisabled,reason,true)}</div>`;
  };
  const focus = characterFocus(character);
  const focusControl = mode === 'battle' && focus !== null && checks.some(check => check.kind === 'combat' && !isCompanionCheck(check) && !check.fixedCombat && check.combat.type !== 'ranged')
    ? `<div class="pp-focus" title="Nahkampffokus wird im Foundry-Charakter gespeichert. Ein erneuter JSON-Import übernimmt wieder den Fokus aus Pedipalpus."><span>Fokus</span><output data-focus="def">DEF ${signed(-focus)}</output><input name="focus" aria-label="Kampffokus" aria-valuetext="OFF ${signed(focus)}, DEF ${signed(-focus)}" type="range" min="-4" max="4" step="1" value="${focus}" ${!actor?.isOwner || busy ? 'disabled' : ''}><output data-focus="off">OFF ${signed(focus)}</output></div>` : '';
  const filters = mode === 'ring' ? '' : `<div class="pp-filters"><label><span class="pp-sr-only">Bereich</span><select name="category" aria-label="Probenbereich">${CATEGORIES.filter(([key]) => ['all','favorites'].includes(key) || available.has(key)).map(([key,label])=>`<option value="${key}" ${key===category?'selected':''}>${mode==='battle'?({all:'Alle Kampfproben',favorites:'Kampffavoriten'}[key]||label):label}</option>`).join('')}</select></label><label class="pp-search"><span class="pp-sr-only">Suche</span><input type="search" name="search" placeholder="${mode==='battle'?'Kampfprobe suchen …':'Probe suchen …'}" aria-label="${mode==='battle'?'Kampfproben durchsuchen':'Fertigkeiten durchsuchen'}" value="${e(search)}"></label></div><p class="pp-search-scope" ${search?'':'hidden'}>Suche in allen Bereichen</p>`;
  const modifierControl = `<div class="pp-modifier"><label><input name="modifier" aria-label="${modifier < 0 || modifierDirection < 0 ? 'Erleichterung' : 'Erschwernis'}" title="Gilt für die nächste Probe, danach wieder 0" type="number" min="0" step="1" data-mode="${modifier === 0 ? 'neutral' : modifier < 0 ? 'relief' : 'difficulty'}" value="${e(Number.isSafeInteger(modifier) ? Math.abs(modifier) : '')}" ${!actor?.isOwner || busy ? 'disabled' : ''}></label><button type="button" name="modifierDirection" title="Zwischen Erschwernis und Erleichterung wechseln" ${!actor?.isOwner || busy ? 'disabled' : ''}>${modifier < 0 || modifierDirection < 0 ? 'Erleichterung' : 'Erschwernis'}</button><span class="pp-wheel-hint"><span class="pp-wheel-steps"><button type="button" data-modifier-step="1" aria-label="Um eins schwerer" ${!actor?.isOwner || busy ? 'disabled' : ''}>↑ schwerer</button><button type="button" data-modifier-step="-1" aria-label="Um eins leichter" ${!actor?.isOwner || busy ? 'disabled' : ''}>↓ leichter</button></span><span>Mausrad</span></span></div>`;
  const presets = Array.isArray(preferences.presets) ? preferences.presets.filter(item=>item && typeof item.id==='string' && typeof item.label==='string' && Number.isSafeInteger(item.modifier)).slice(0,8) : [];
  const presetControl = presets.length ? `<div class="pp-preset-bar" aria-label="Modifikator-Vorlagen">${presets.map(item=>button('preset',e(item.label),`class="pp-preset-button" data-preset="${e(item.id)}" title="${e(item.label)} · ${item.modifier<0?'Erleichterung':'Erschwernis'} ${number(Math.abs(item.modifier))}" ${!actor?.isOwner || busy?'disabled':''}`)).join('')}</div>` : '';
  const favoriteChecks = allChecks.filter(isFavorite).sort((a,b)=>favoriteKeys.indexOf(keyOf(a))-favoriteKeys.indexOf(keyOf(b))).slice(0,6);
  const quickbar = mode === 'full' && favoriteChecks.length ? `<details class="pp-quickbar" ${preferences.quickbar === false ? '' : 'open'}><summary>${categoryIcon('favorites')} Schnellleiste</summary><div class="pp-quick-grid">${favoriteChecks.map(check=>`<div class="pp-quick-check" data-quick-check="${e(check.id)}"><header>${nameButton(check,`${label(check)}${original(check)}`)}${favoriteButton(check)}</header>${rolls(check)}</div>`).join('')}</div></details>` : '';
  let list;
  if (mode === 'ring') {
    list = `<div class="pp-check-list pp-ring-list"><div class="pp-ring" data-count="${checks.length}">${checks.length ? button('full','↗','class="pp-ring-center" aria-label="Vollständiges Fenster öffnen" title="Vollständiges Fenster öffnen"') : ''}${checks.map((check,index)=>`<section class="pp-check-row pp-ring-card" ${rankAttributes(check).replace(/style="[^"]*"/,'')} style="--pp-mastery:${mastery(check).progress};--pp-position:${index};--pp-x:${Math.round(Math.sin(index*2*Math.PI/checks.length)*155)}px;--pp-y:${Math.round(-Math.cos(index*2*Math.PI/checks.length)*112)}px"><header>${categoryIcon(categoryOf(check))}${nameButton(check,`${label(check)}${original(check)}`)}${favoriteButton(check)}</header><div class="pp-ring-values">${probe(check,probeTheme)}${rating(check)}</div>${rolls(check)}</section>`).join('')}</div><p class="pp-no-results" ${checks.length?'hidden':''}>Keine passende Probe gefunden.</p>${checks.length?'':'<p class="pp-ring-help">Favoriten im vollständigen Fenster mit dem Stern auswählen.</p>'}</div>`;
  } else {
    const groups = new Map();
    checks.filter(check=>check.kind==='combat').forEach(check=>{ const key=weaponKey(check); if(!groups.has(key))groups.set(key,[]); groups.get(key).push(check); });
    const seen = new Set(),talentGroups=new Map(),companionRows=new Map();
    const talentKey=check=>/^(BodySkills|SocialSkills|NatureSkills|AcademicSkills|CraftingSkills):\d+:\d+$/.test(check.id)&&check.foundation?check.id.split(':').slice(0,2).join(':'):'';
    for(const check of checks){const key=talentKey(check);if(key){if(!talentGroups.has(key))talentGroups.set(key,[]);talentGroups.get(key).push(check);}}
    const rows = checks.map(check=>{
      const rank=mastery(check);
      const foundation=check.foundation || check.group?.split(' · ').slice(1).join(' · ') || '';
      const group=weaponKey(check),talent=talentKey(check);
      let heading='';
      if(group && !seen.has(group)) {
        seen.add(group);
        heading=`<tr class="pp-weapon-header" data-weapon-group="${e(group)}" data-check-ids="${e(JSON.stringify(groups.get(group).map(item=>item.id)))}" data-category="${e(categoryOf(check))}"><th colspan="5">${categoryIcon(categoryOf(check))}<span>${e(check.combat.weaponName)}</span><small>${e(check.fixedCombat ? 'Fertiger Probenwert' : check.companionName || (check.animalName ? check.animalName : `${foundation} · Talent ${number(check.combat.skillValue)}`))}</small></th></tr>`;
      }
      if(talent&&!seen.has(talent)){seen.add(talent);heading=`<tr class="pp-talent-header" data-talent-group="${e(talent)}" data-check-ids="${e(JSON.stringify(talentGroups.get(talent).map(item=>item.id)))}" data-category="${e(categoryOf(check))}"><th scope="rowgroup" colspan="5">${categoryIcon(categoryOf(check))}<span>${e(language==='ork'?orkTalentName(foundation):foundation)}${language==='ork'?`<small class="pp-original-name">${e(foundation)}</small>`:''}</span><small>${e(uiText(language,'Basis'))} ${number(check.foundationValue)}</small></th></tr>`;}
      const title = group ? actionLabel(check) : checkDisplayName(check,language);
      const subtitle = group ? '' : language === 'ork' && ['skill','attribute'].includes(check.kind) ? check.name : talent?'':foundation;
      const row=`${heading}<tr class="pp-check-row ${group?'pp-weapon-action':''} ${talent?'pp-talent-child':''}" ${talent?`data-talent-group="${e(talent)}"`:''} ${rankAttributes(check)} ${group?`data-weapon-group="${e(group)}"`:''}><td class="pp-favorite-cell">${favoriteButton(check)}</td><td class="pp-name-cell">${nameButton(check,`${group?'':categoryIcon(categoryOf(check))}${rank.grade==='master'?'<span class="pp-master-star" aria-hidden="true">✦</span> ':''}${e(title)}`)}${subtitle?`<small class="${language === 'ork' && ['skill','attribute'].includes(check.kind) ? 'pp-original-name' : ''}">${e(subtitle)}</small>`:''}</td><td>${probe(check,probeTheme)}</td><td class="pp-value">${rating(check)}</td><td>${rolls(check)}</td></tr>`;
      if(mode==='battle'&&isCompanionCheck(check)){const key=`${check.companionGroup??check.id.split(':')[0]}:${check.companionIndex??check.id.split(':')[1]}`;companionRows.set(key,(companionRows.get(key)??'')+row);return '';}return row;
    }).join('');
    const companions=mode==='battle'?`<div class="pp-companion-overviews">${companionEntries(character).map((member,index)=>{const key=`${member._group}:${member._index}`,body=companionRows.get(key)??'';let identity='';try{identity=companionKey(character,index);}catch{}return `<details class="pp-companion-section" data-companion-section="${e(identity||key)}" data-inventory="${e(member._group)}"><summary data-companion-card data-search="${e(`${member.Name} ${member.Species??''} ${member.Domain??''}`.toLocaleLowerCase('de'))}"><strong>${e(member.Name)}</strong><span>${e(member.Domain??member.Species??'')} · LE ${number(member.CurrentLe)} / ${number(member.MaxLe)}</span></summary><div class="pp-companion-content">${button('animal-portrait',e(uiText(language,'Bild / Token')),`data-animal="${index}" data-animal-key="${e(identity)}" ${!actor?.isOwner||busy||!identity?'disabled':''}`)}${Number.isSafeInteger(member.AstralEnergy)?`<span>AE ${number(member.CurrentAstralEnergy)} / ${number(member.AstralEnergy)}</span>`:''}<table class="pp-table"><tbody>${body}</tbody></table></div></details>`;}).join('')}</div>`:'';
    list=`<div class="pp-check-list"><table class="pp-table"><thead><tr><th scope="col" class="pp-favorite-cell"><span class="pp-sr-only">Favoriten</span></th><th scope="col">Probe</th><th scope="col">Attribute</th><th scope="col" class="pp-value">Wert</th><th scope="col"><span class="pp-sr-only">Würfeln</span></th></tr></thead><tbody>${rows}</tbody></table>${companions}<p class="pp-no-results" hidden>Keine passende Probe gefunden.</p></div>`;
  }
  return `${openRoot}${toolbar}${admin}${filters}${modifierControl}${presetControl}${focusControl}${quickbar}${mode==='battle'?renderBattleInventory(character,actor,busy,language):''}${list}${fixedStatus}</div>`;
}

function renderBattleInventory(character,actor,busy,language) {
 const t=text=>e(uiText(language,text)),armors=armorItems(character);
 const checkbox=(item,field,label)=>`<label>${t(label)}<input type="checkbox" data-armor="${e(item.id)}" data-armor-field="${field}" data-armor-locked="${Boolean(item.carrierAnimalId)}" aria-label="${e(item.name)} · ${t(label)}" ${item[field]?'checked':''} ${!actor?.isOwner||busy||!character.sourceJSON||field==='equipped'&&item.carrierAnimalId?'disabled':''}></label>`;
 const armor=`<section class="pp-battle-inventory pp-armor-panel" data-inventory="armors" hidden><h3>${t('Rüstungen')}</h3>${armors.length?armors.map(item=>`<article class="pp-armor-card"><header><strong>${e(item.name)}</strong><span>RS ${number(item.armor)} · BE ${number(item.basePenalty??item.penalty)}</span></header><div>${item.carried===null?'':checkbox(item,'carried','Dabei')}${checkbox(item,'equipped','Angelegt')}${item.carrierAnimalId?`<small>${t('Beim Gefolge')}</small>`:''}</div></article>`).join(''):`<p>${t('Keine Rüstungen vorhanden.')}</p>`}</section>`;
 return armor;
}

export function renderImportOptions(actors, selectedId, canCreate, tokenFrame='concrete',kind='character') {
  const picker=type=>{const npc=type==='npc';return `<section class="pp-import-panel" data-import-panel="${type}" ${kind===type?'':'hidden'}><button type="button" ${npc?'data-pick-npc':'data-pick-character'} ${typeof globalThis.showOpenFilePicker==='function'?'':'hidden'}>${npc?'NSC-Datei auswählen':'Datei auswählen'}</button><label>${npc?'NSC-Datei (.nsc.json)':'Pedipalpus-Charakterdatei'}<input type="file" name="${npc?'npcFile':'characterFile'}" ${typeof globalThis.showOpenFilePicker==='function'?'hidden':''} accept=".json,.zip,.png,.jpg,.jpeg,.bmp,.webp,application/json,application/zip" multiple></label><button type="button" ${npc?'data-pick-npc-folder':'data-pick-folder'} ${typeof globalThis.showDirectoryPicker==='function'?'':'hidden'}>${npc?'NSC-Ordner auswählen':'Pedipalpus-Ordner auswählen'}</button><label ${typeof globalThis.showDirectoryPicker==='function'?'hidden':''}>${npc?'Oder NSC-Ordner auswählen':'Oder Pedipalpus-Ordner auswählen'}<input type="file" name="${npc?'npcFolder':'characterFolder'}" webkitdirectory multiple></label><p class="pp-folder-source" data-folder-source="${type}"></p><label class="pp-folder-choice" hidden>${npc?'NSC aus Ordner':'Charakter aus Ordner'}<select name="${npc?'folderNpc':'folderCharacter'}"></select></label></section>`;};
  return `<div class="pp-import"><div class="pp-import-kinds" role="group" aria-label="Importart"><button type="button" data-import-kind="character" aria-pressed="${kind==='character'}">Charakter importieren</button><button type="button" data-import-kind="npc" aria-pressed="${kind==='npc'}">NSC importieren</button></div>${picker('character')}${picker('npc')}<p class="pp-import-preview">Bitte eine JSON-Datei auswählen.</p><label>In Foundry speichern als<select name="destination">${canCreate ? `<option value="" ${selectedId ? '' : 'selected'}>Neuen Charakter anlegen</option>` : ''}${actors.map(actor => `<option value="${e(actor.id)}" ${actor.id === selectedId ? 'selected' : ''}>${e(actor.name)}${actor.getFlag?.('pedipalpus-foundry','character')?.sourceFormat==='Pedipalpus.Npc'?' [NSC]':''}</option>`).join('')}</select></label><label class="pp-import-toggle"><input type="checkbox" name="includeImages" checked> Bilder übernehmen</label><div data-image-options><p class="pp-portrait-source">Optional ein Charakterbild auswählen.</p><label>Charakterbild (optional)<input type="file" name="portraitFile" accept=".png,.jpg,.jpeg,.bmp,.webp"></label><p class="pp-portrait-preview">Kein Bild ausgewählt. Vorhandene Foundry-Bilder bleiben erhalten.</p></div><label>Tokenrahmen<select name="tokenFrame">${tokenStyles().map(([key,label])=>`<option value="${key}" ${key===tokenFrame?'selected':''}>${label}</option>`).join('')}</select></label><p class="pp-token-frame-info">${customFrameFor(tokenFrame)?'Dein eigener Rahmen ist gespeichert.':savedFrames()[tokenFrame]?'Der runde Token verwendet den Originalrahmen.':'Für die Originalrahmen einmal das private Rahmenpaket in den Einstellungen importieren. Ohne Rahmen entsteht ein rundes Token.'}</p><label class="pp-import-toggle"><input type="checkbox" name="includeCompanions" checked> Begleiter übernehmen</label><p class="pp-hint">Ohne Begleiterimport bleiben bisherige Begleiter und ihre Tokens unverändert.</p><div data-companion-import-options></div>${globalThis.game?.user?.isGM?`<label>Spieler zuweisen<select name="ownerId"><option value="">Bisherige Rechte behalten</option>${(game.users?.contents??Array.from(game.users??[])).filter(user=>!user.isGM).map(user=>`<option value="${e(user.id)}">${e(user.name??user.id)}</option>`).join('')}</select></label><p class="pp-hint">Der Spieler erhält Besitzerrechte am Charakter und an den ausgewählten Begleiter-Einträgen. Bestehende Rechte bleiben erhalten.</p>`:''}<p>Beim Import werden die Pedipalpus-Daten ersetzt. Mit Bildauswahl werden Charakterbild, Token-Vorlage und bearbeitbare verknüpfte Tokens aktualisiert. Berechtigungen und übrige Foundry-Werte bleiben erhalten.</p></div>`;
}

export function renderCompanionImportOptions(character,actorId){
 const members=companionEntries(character),targets=companionImportTargets(actorId),canCreate=foundry.documents.Actor.canUserCreate(game.user);
 if(!members.length)return '<p class="pp-hint">Keine Begleiter in dieser Datei.</p>';
 return `<p class="pp-hint">Für jeden Begleiter einen neuen Token-Eintrag anlegen oder einen eigenen Begleiter bzw. leeren Foundry-Eintrag aktualisieren. Vorhandene Hauptcharaktere und NSCs sind geschützt.</p>${members.map((member,index)=>{let key='',linked=null;try{key=companionKey(character,index);linked=companionActor(actorId,key);}catch{}return `<label>${e(member.Name)}<select data-companion-import-index="${index}" ${key?'':'disabled'}><option value="">Keinen Token ändern</option>${canCreate?'<option value="new">Neuen Token-Eintrag anlegen</option>':''}${targets.map(target=>`<option value="${e(target.id)}" ${linked?.id===target.id?'selected':''}>${e(target.name)} aktualisieren</option>`).join('')}</select></label>`;}).join('')}`;
}
