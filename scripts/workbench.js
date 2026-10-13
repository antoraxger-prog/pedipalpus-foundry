import { MODULE_ID } from './data.js';

const plain = value => value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const text = value => typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/g, ' ') : '';
const safeText = (value, maximum = 160) => text(value).slice(0, maximum);
const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
const actorKey = value => typeof value === 'string' && value.length > 0 && value.length <= 160 && !forbidden.has(value);
const choices = (value, options, fallback) => options.includes(value) ? value : fallback;

export const DEFAULT_WORKBENCH = Object.freeze({
  actorId: null, category: 'all', favorites: Object.freeze({}), recent: Object.freeze({}),
  density: 'normal', language: 'theme', animations: 'subtle', sound: true, volume: 0.25, soundVersion: 1,
  soundSet: 'theme', presets: Object.freeze([]), followToken: false
});

function canonicalReference(value) {
  if (!plain(value) || !['attribute', 'skill', 'combat'].includes(value.kind)) throw new Error('Die gespeicherte Probe ist ungültig.');
  const category = text(value.category), name = text(value.name);
  if (!category || category.length > 80 || !name || name.length > 320) throw new Error('Die gespeicherte Probe ist unvollständig.');
  const ref = { kind: value.kind, category, name };
  if (ref.kind === 'combat') {
    if (!['attack', 'parry', 'ranged'].includes(value.combatType) || !text(value.weaponName)
        || text(value.weaponName).length > 320) throw new Error('Die gespeicherte Kampfprobe ist unvollständig.');
    ref.combatType = value.combatType;
    ref.weaponName = text(value.weaponName);
    if (value.category === 'animals') {
      if (typeof value.animalName !== 'string' || text(value.animalName).length > 160) throw new Error('Die gespeicherte Tierprobe ist unvollständig.');
      ref.animalName = text(value.animalName);
    }
  }
  return ref;
}

export function checkReference(check) {
  if (!check || typeof check !== 'object') throw new Error('Die Probe wurde nicht gefunden.');
  const parts = typeof check.id === 'string' ? check.id.split(':') : [];
  const animals = parts[0] === 'animals' || typeof check.animalName === 'string';
  const category = animals ? 'animals' : check.kind === 'combat'
    ? parts[0] === 'combat' && parts[1] ? parts[1] : text(check.category) || 'combat'
    : text(check.category) || parts[0] || check.kind;
  return canonicalReference({ kind: check.kind, category, name: check.name,
    ...(check.kind === 'combat' ? { combatType: check.combat?.type, weaponName: check.combat?.weaponName,
      ...(animals ? { animalName: check.animalName ?? '' } : {}) } : {}) });
}

export function referenceKey(reference) {
  const ref = canonicalReference(reference);
  return JSON.stringify([ref.kind, ref.category, ref.name.toLocaleLowerCase('de'),
    ref.combatType ?? '', ref.weaponName?.toLocaleLowerCase('de') ?? '', ref.animalName?.toLocaleLowerCase('de') ?? '']);
}

export function resolveCheck(character, reference) {
  const key = referenceKey(reference);
  const matches = (character?.checks ?? []).filter(check => {
    try { return referenceKey(checkReference(check)) === key; } catch { return false; }
  });
  if (!matches.length) throw new Error('Diese Probe ist im aktuellen Charakter nicht mehr vorhanden. Bitte die Auswahl aktualisieren.');
  if (matches.length !== 1) throw new Error('Diese Probe ist mehrdeutig. Bitte die passende Probe direkt in der Liste auswählen.');
  return matches[0];
}

export function groupWeaponChecks(checks) {
  const buckets = new Map();
  for (const check of Array.isArray(checks) ? checks : []) {
    if (check?.kind !== 'combat') continue;
    let ref;
    try { ref = checkReference(check); } catch { continue; }
    const key = JSON.stringify([ref.category, ref.weaponName.toLocaleLowerCase('de'), ref.animalName?.toLocaleLowerCase('de') ?? '']);
    if (!buckets.has(key)) buckets.set(key, { name: ref.weaponName, checks: [] });
    buckets.get(key).checks.push(check);
  }
  const groups = [];
  for (const [key, bucket] of buckets) {
    const counts = new Map();
    for (const check of bucket.checks) counts.set(check.combat.type, (counts.get(check.combat.type) ?? 0) + 1);
    if (![...counts.values()].some(count => count > 1)) {
      groups.push({ key, name: bucket.name, checks: [...bucket.checks] });
      continue;
    }
    const instances = new Map();
    bucket.checks.forEach((check, index) => {
      const match = /^(combat:[^:]+:\d+|animals:\d+:\d+):(attack|parry|ranged)$/.exec(check.id ?? '');
      const instance = match?.[1] ?? `unpaired:${index}`;
      if (!instances.has(instance)) instances.set(instance, []);
      instances.get(instance).push(check);
    });
    for (const [instance, members] of instances) {
      const types = members.map(check => check.combat.type);
      if (new Set(types).size !== types.length) {
        members.forEach((check, index) => groups.push({ key: `${key}:${instance}:${index}`, name: bucket.name, checks: [check], ambiguous: true }));
      } else groups.push({ key: `${key}:${instance}`, name: bucket.name, checks: [...members], ambiguous: true });
    }
  }
  return groups;
}

function referencesByActor(value, maximum) {
  const result = {};
  if (!plain(value)) return result;
  for (const [id, references] of Object.entries(value).slice(0, 200)) {
    if (!actorKey(id) || !Array.isArray(references)) continue;
    const seen = new Set(), valid = [];
    for (const entry of references.slice(0, 400)) {
      try {
        const ref = canonicalReference(entry), key = referenceKey(ref);
        if (!seen.has(key)) { seen.add(key); valid.push(ref); }
      } catch { /* Ungültige gespeicherte Einträge werden verworfen. */ }
      if (valid.length >= maximum) break;
    }
    result[id] = valid;
  }
  return result;
}

export function validateWorkbench(value) {
  const source = plain(value) ? value : {};
  const seen = new Set(), presets = [];
  for (const entry of Array.isArray(source.presets) ? source.presets.slice(0, 24) : []) {
    if (!plain(entry) || !text(entry.id) || !text(entry.label) || !Number.isSafeInteger(entry.modifier)) continue;
    const id = safeText(entry.id, 80);
    if (seen.has(id)) continue;
    seen.add(id);
    presets.push({ id, label: safeText(entry.label, 80), modifier: entry.modifier });
  }
  return {
    actorId: actorKey(source.actorId) ? source.actorId : null,
    category: typeof source.category === 'string' && /^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(source.category) ? source.category : 'all',
    favorites: referencesByActor(source.favorites, 100), recent: referencesByActor(source.recent, 12),
    density: choices(source.density, ['normal', 'compact', 'comfortable'], 'normal'),
    language: choices(source.language, ['theme', 'standard', 'ork'], 'theme'),
    animations: choices(source.animations, ['none', 'subtle', 'full'], 'subtle'),
    soundVersion: 1, sound: source.soundVersion === 1 ? source.sound !== false : true, volume: typeof source.volume === 'number' && Number.isFinite(source.volume) ? Math.max(0, Math.min(1, source.volume)) : 0.25,
    soundSet: choices(source.soundSet, ['theme', 'fantasy', 'ork', 'dark', 'light', 'dice'], 'theme'),
    presets, followToken: source.followToken === true
  };
}

export function registerWorkbenchSettings() {
  game.settings.register(MODULE_ID, 'workbench', { scope: 'user', config: false, type: Object, default: validateWorkbench(DEFAULT_WORKBENCH) });
  game.settings.register(MODULE_ID, 'windowState', { scope: 'client', config: false, type: Object, default: {} });
}

export function loadWorkbench() {
  try { return validateWorkbench(game.settings.get(MODULE_ID, 'workbench')); }
  catch { return validateWorkbench(DEFAULT_WORKBENCH); }
}

export async function saveWorkbench(prefs) {
  const clean = validateWorkbench(prefs);
  await game.settings.set(MODULE_ID, 'workbench', clean);
  return clean;
}

function asReference(checkOrRef) {
  return checkOrRef?.id || checkOrRef?.combat || !checkOrRef?.category ? checkReference(checkOrRef) : canonicalReference(checkOrRef);
}

export function isFavorite(prefs, actorId, checkOrRef) {
  if (!actorKey(actorId)) return false;
  const key = referenceKey(asReference(checkOrRef));
  return validateWorkbench(prefs).favorites[actorId]?.some(ref => referenceKey(ref) === key) ?? false;
}

export function toggleFavorite(prefs, actorId, checkOrRef) {
  if (!actorKey(actorId)) throw new Error('Bitte zuerst einen Charakter auswählen.');
  const result = validateWorkbench(prefs), ref = asReference(checkOrRef), key = referenceKey(ref);
  const entries = result.favorites[actorId] ?? [];
  result.favorites[actorId] = entries.some(item => referenceKey(item) === key)
    ? entries.filter(item => referenceKey(item) !== key) : [...entries, ref];
  return validateWorkbench(result);
}

export function moveFavorite(prefs, actorId, checkOrRef, direction) {
  if (!actorKey(actorId)) throw new Error('Bitte zuerst einen Charakter auswählen.');
  const step = direction === 'up' ? -1 : direction === 'down' ? 1 : direction;
  if (step !== -1 && step !== 1) throw new Error('Die Richtung muss oben oder unten sein.');
  const result = validateWorkbench(prefs), key = referenceKey(asReference(checkOrRef));
  const entries = result.favorites[actorId] ?? [], index = entries.findIndex(ref => referenceKey(ref) === key), target = index + step;
  if (index >= 0 && target >= 0 && target < entries.length) [entries[index], entries[target]] = [entries[target], entries[index]];
  return result;
}

export function recordRecent(prefs, actorId, checkOrRef) {
  if (!actorKey(actorId)) throw new Error('Bitte zuerst einen Charakter auswählen.');
  const result = validateWorkbench(prefs), ref = asReference(checkOrRef), key = referenceKey(ref);
  result.recent[actorId] = [ref, ...(result.recent[actorId] ?? []).filter(item => referenceKey(item) !== key)].slice(0, 12);
  return result;
}
