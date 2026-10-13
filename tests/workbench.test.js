import { test } from 'node:test';
import assert from 'node:assert/strict';
import { combatFixture } from './fixture.js';
import { normalizeCharacter, MODULE_ID } from '../scripts/data.js';
import { withFocus } from '../scripts/combat.js';
import { checkReference, resolveCheck, referenceKey, groupWeaponChecks, DEFAULT_WORKBENCH,
  validateWorkbench, registerWorkbenchSettings, loadWorkbench, saveWorkbench,
  toggleFavorite, moveFavorite, recordRecent, isFavorite } from '../scripts/workbench.js';
import { compareCharacters } from '../scripts/import-diff.js';

const attack = (character, weapon = 'Rapier') => character.checks.find(check => check.combat?.weaponName === weapon && check.combat.type === 'attack');

test('References survive weapon reordering and resolve current values and selected techniques', () => {
  const raw = combatFixture(), previous = normalizeCharacter(raw), reference = checkReference(attack(previous));
  raw.MeleeWeapons.unshift({ ...raw.MeleeWeapons[0], Name: 'Schwert' });
  raw.MeleeSkills[0].Value = 12;
  const next = normalizeCharacter(raw), resolved = resolveCheck(next, reference);
  assert.notEqual(resolved.id, attack(previous).id);
  assert.equal(resolved.combat.weaponName, 'Rapier');
  assert.equal(resolved.combat.skillName, 'Fechtwaffen');
  assert.equal(resolved.combat.skillValue, 12);
  assert.equal(referenceKey(checkReference(resolved)), referenceKey(reference));
  assert.equal('skillName' in reference, false);
  assert.equal(reference.category, 'MeleeWeapons');
});

test('References never choose an arbitrary duplicate or missing check', () => {
  const raw = combatFixture(), previous = normalizeCharacter(raw), reference = checkReference(attack(previous));
  raw.MeleeWeapons.push({ ...raw.MeleeWeapons[0], AttackBonus: 8 });
  assert.throws(() => resolveCheck(normalizeCharacter(raw), reference), /mehrdeutig/);
  raw.MeleeWeapons = [];
  assert.throws(() => resolveCheck(normalizeCharacter(raw), reference), /nicht mehr vorhanden/);
  assert.throws(() => referenceKey({ kind: 'combat', category: 'MeleeWeapons', name: 'Rapier' }), /unvollständig/);
});

test('Animal and source categories keep distinct probes separate', () => {
  const data = normalizeCharacter(combatFixture());
  const animal = data.checks.find(check => check.id.startsWith('animals:'));
  const reference = checkReference(animal);
  assert.equal(reference.animalName, 'Wolf');
  assert.equal(reference.category, 'animals');
  assert.equal(resolveCheck(data, reference), animal);
  const shield = data.checks.find(check => check.combat?.weaponName === 'Schild');
  assert.equal(checkReference(shield).category, 'ParryWeapons');
  const sameName = { ...shield, id: 'combat:MeleeWeapons:1:attack' };
  assert.notEqual(referenceKey(checkReference(shield)), referenceKey(checkReference(sameName)));
});

test('Weapon groups pair only known instances and mark identical named weapons ambiguous', () => {
  const raw = combatFixture(), initial = normalizeCharacter(raw), groups = groupWeaponChecks(initial.checks);
  const rapier = groups.find(group => group.name === 'Rapier');
  assert.equal(rapier.checks.length, 2);
  assert.deepEqual(rapier.checks.map(check => check.combat.type), ['attack', 'parry']);
  raw.MeleeWeapons.unshift({ ...raw.MeleeWeapons[0], Name: 'Schwert' });
  assert.equal(groupWeaponChecks(normalizeCharacter(raw).checks).find(group => group.name === 'Rapier').key, rapier.key);
  raw.MeleeWeapons.push({ ...raw.MeleeWeapons[1], AttackBonus: 9 });
  const duplicates = groupWeaponChecks(normalizeCharacter(raw).checks).filter(group => group.name === 'Rapier');
  assert.equal(duplicates.length, 2);
  assert.equal(new Set(duplicates.map(group => group.key)).size, 2);
  assert.ok(duplicates.every(group => group.ambiguous && group.checks.length === 2));
  const unknown = [attack(initial), { ...attack(initial), id: 'unknown' }];
  assert.ok(groupWeaponChecks(unknown).every(group => group.checks.length === 1));
});

test('Favorite and recent helpers preserve input and keep order by actor and semantic identity', () => {
  const data = normalizeCharacter(combatFixture()), rapier = attack(data), geography = data.checks.find(check => check.name === 'Geographie');
  const original = validateWorkbench(DEFAULT_WORKBENCH), untouched = JSON.stringify(original);
  let prefs = toggleFavorite(original, 'actor-a', rapier);
  prefs = toggleFavorite(prefs, 'actor-a', geography);
  assert.equal(JSON.stringify(original), untouched);
  assert.equal(isFavorite(prefs, 'actor-a', rapier), true);
  assert.equal(isFavorite(prefs, 'actor-b', rapier), false);
  prefs = moveFavorite(prefs, 'actor-a', geography, 'up');
  assert.equal(prefs.favorites['actor-a'][0].name, 'Geographie');
  prefs = moveFavorite(prefs, 'actor-a', geography, -1);
  assert.equal(prefs.favorites['actor-a'][0].name, 'Geographie');
  prefs = recordRecent(recordRecent(recordRecent(prefs, 'actor-a', rapier), 'actor-a', geography), 'actor-a', rapier);
  assert.equal(prefs.recent['actor-a'].length, 2);
  assert.equal(prefs.recent['actor-a'][0].weaponName, 'Rapier');
  prefs = toggleFavorite(prefs, 'actor-a', checkReference(rapier));
  assert.equal(isFavorite(prefs, 'actor-a', rapier), false);
  assert.throws(() => moveFavorite(prefs, 'actor-a', geography, 50), /Richtung/);
  assert.throws(() => toggleFavorite(prefs, '__proto__', rapier), /Charakter/);
});

test('Preferences validate untrusted entries and never share mutable defaults', () => {
  const data = normalizeCharacter(combatFixture()), reference = checkReference(attack(data));
  const raw = JSON.parse('{"favorites":{"__proto__":[],"constructor":[]},"actorId":"__proto__"}');
  Object.assign(raw, { category: 12, density: 'huge', language: '???', animations: false,
    sound: 'true', volume: Infinity, soundSet: 'remote-url', followToken: 1,
    presets: [{ id: 'one', label: ' Dunkelheit ', modifier: 2 }, { id: 'one', label: 'Duplicate', modifier: 3 }, { id: 'two', label: 'Bad', modifier: 1.5 }] });
  raw.favorites.valid = [reference, { nonsense: true }, reference];
  const prefs = validateWorkbench(raw);
  assert.equal(prefs.actorId, null);
  assert.equal(prefs.category, 'all');
  assert.equal(prefs.density, 'normal');
  assert.equal(prefs.language, 'theme');
  assert.equal(prefs.animations, 'subtle');
  assert.equal(prefs.sound, true);
  assert.equal(prefs.followToken, false);
  assert.equal(prefs.volume, 0.25);
  assert.equal(prefs.soundSet, 'theme');
  assert.deepEqual(Object.keys(prefs.favorites), ['valid']);
  assert.equal(prefs.favorites.valid.length, 1);
  assert.deepEqual(prefs.presets, [{ id: 'one', label: 'Dunkelheit', modifier: 2 }]);
  const one = validateWorkbench(null), two = validateWorkbench(null);
  one.favorites.example = [reference];
  assert.equal(two.favorites.example, undefined);
  assert.equal(DEFAULT_WORKBENCH.favorites.example, undefined);
  assert.equal(validateWorkbench({ volume: -0.5 }).volume, 0);
  assert.equal(validateWorkbench({ volume: 1.5 }).volume, 1);
});

test('Quiet sounds start enabled once; a later personal mute and zero volume persist', () => {
  const first=validateWorkbench(null);
  assert.equal(first.sound,true);
  assert.equal(first.volume,0.25);
  assert.equal(validateWorkbench({sound:false,volume:0.25}).sound,true);
  const muted=validateWorkbench({...first,sound:false,volume:0});
  assert.equal(validateWorkbench(muted).sound,false);
  assert.equal(validateWorkbench(muted).volume,0);
});

test('Workbench uses individual user storage; window dimensions use client storage', async () => {
  const previousGame = globalThis.game, configs = new Map(), values = new Map();
  const key = (namespace, name) => `${configs.get(`${namespace}.${name}`).scope === 'user' ? game.user.id : 'client'}:${namespace}.${name}`;
  globalThis.game = { user: { id: 'player-a' }, settings: {
    register(namespace, name, config) { configs.set(`${namespace}.${name}`, config); },
    get(namespace, name) { return values.get(key(namespace, name)) ?? configs.get(`${namespace}.${name}`).default; },
    async set(namespace, name, value) { values.set(key(namespace, name), structuredClone(value)); }
  } };
  try {
    registerWorkbenchSettings();
    assert.equal(configs.get(`${MODULE_ID}.workbench`).scope, 'user');
    assert.equal(configs.get(`${MODULE_ID}.windowState`).scope, 'client');
    await saveWorkbench({ actorId: 'actor-a', category: 'favorites', sound: true });
    game.user.id = 'player-b';
    assert.equal(loadWorkbench().actorId, null);
    assert.equal(loadWorkbench().sound, true);
    await saveWorkbench({ actorId: 'actor-b', category: 'battle' });
    game.user.id = 'player-a';
    assert.equal(loadWorkbench().actorId, 'actor-a');
    assert.equal(loadWorkbench().category, 'favorites');
    assert.equal(loadWorkbench().sound, true);
  } finally { globalThis.game = previousGame; }
});

test('Import comparison follows semantics through reordering, changes focus separately and does not mutate', () => {
  const raw = combatFixture(), before = normalizeCharacter(raw);
  raw.MeleeWeapons.unshift({ ...raw.MeleeWeapons[0], Name: 'Schwert' });
  raw.AcademicSkills[0].Subskills[0].TotalValue = 11;
  raw.HobbySkills = [];
  const after = withFocus(normalizeCharacter(raw), 1), original = JSON.stringify({ before, after });
  const diff = compareCharacters(before, after);
  assert.ok(diff.some(row => row.label === 'Geographie' && row.before === 8 && row.after === 11 && row.type === 'changed'));
  assert.ok(diff.some(row => row.label === 'Schach' && row.type === 'removed'));
  assert.ok(diff.some(row => row.label === 'Schwert · Angriff' && row.type === 'added'));
  assert.equal(diff.some(row => row.label === 'Rapier · Angriff' && row.type !== 'changed'), false);
  assert.ok(diff.some(row => row.label === 'Kampffokus (OFF / DEF)' && row.before === '-4 / 4' && row.after === '1 / -1'));
  assert.equal(JSON.stringify({ before, after }), original);
  assert.deepEqual(compareCharacters(before, structuredClone(before)), []);
});

test('Import comparison reports duplicate references and changed probe components despite unchanged total', () => {
  const raw = combatFixture(), before = normalizeCharacter(raw);
  raw.MeleeWeapons.push({ ...raw.MeleeWeapons[0], AttackBonus: 9 });
  assert.equal(compareCharacters(before, normalizeCharacter(raw)).filter(row => row.type === 'ambiguous').length, 2);
  const after = structuredClone(before), changed = after.checks.find(check => check.name === 'Geographie');
  changed.attributes[0].value = 17;
  assert.ok(compareCharacters(before, after).some(row => row.label === 'Geographie · Probenattribute' && row.type === 'changed'));
  const rapier = attack(after);
  rapier.combat.skillValue += 1;
  rapier.combat.baseValue -= 1;
  assert.ok(compareCharacters(before, after).some(row => row.label === 'Rapier · Angriff · Berechnung'));
  assert.equal(compareCharacters(before, after).some(row => row.label === 'Rapier · Angriff'), false);
});
