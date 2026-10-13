import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fixture, combatFixture } from './fixture.js';
import { parseCharacter, normalizeCharacter, MODULE_ID, FLAG, MAX_FILE_SIZE } from '../scripts/data.js';
import { buildCommand, connectionStatus, executeCheck } from '../scripts/commands.js';
import { saveCharacter, getCharacter, linkToken } from '../scripts/storage.js';
import { renderView, rollableChecks, mastery } from '../scripts/view.js';
import { preparePortrait, uploadPortrait, applyPortrait } from '../scripts/portraits.js';
import { characterFocus, withFocus } from '../scripts/combat.js';
import { saveFocus } from '../scripts/storage.js';

test('Focus updates attack and parry in opposite directions without changing ranged, animal or talent values', () => {
  const data = normalizeCharacter(combatFixture());
  assert.equal(characterFocus(data), -4);
  const changed = withFocus(data, 3);
  assert.equal(changed.combat.offDefOffset, 3);
  assert.equal(changed.combat.offOffset, 3);
  assert.equal(changed.combat.defOffset, -3);
  for (const before of data.checks) {
    const after = changed.checks.find(check => check.id === before.id);
    if (before.kind !== 'combat' || before.id.startsWith('animals:') || before.combat.type === 'ranged') assert.deepEqual(after, before);
    else {
      assert.equal(after.value - before.value, before.combat.type === 'attack' ? 7 : -7);
      assert.equal(after.combat.skillValue, before.combat.skillValue);
      assert.doesNotThrow(() => buildCommand(after));
    }
  }
  assert.equal(characterFocus(data), -4);
  for (const invalid of [-5, 5, 0.5, NaN, '2']) assert.throws(() => withFocus(data, invalid), /zwischen/);
  assert.equal(characterFocus(withFocus(data, 0)), 0);
});

test('Existing combat imports infer focus; conflicting or missing saved offsets are not guessed', () => {
  const data = normalizeCharacter(combatFixture());
  delete data.combat.offDefOffset;
  assert.equal(characterFocus(data), -4);
  data.checks.find(check => check.combat?.type === 'parry').combat.focusValue = 2;
  assert.equal(characterFocus(data), null);
  assert.throws(() => withFocus(data, 0), /unvollständig/);
  assert.equal(characterFocus(normalizeCharacter(fixture())), null);
});

test('Focus persists on the current actor snapshot and respects ownership and failed writes', async () => {
  const env = runtime('1.0.14');
  await saveCharacter(normalizeCharacter(combatFixture()), env.document.id);
  await saveFocus(env.document, 2);
  assert.equal(characterFocus(getCharacter(env.document)), 2);
  assert.equal(env.document.flags.thirdParty.value, 7);
  env.document.isOwner = false;
  await assert.rejects(saveFocus(env.document, 0), /Besitzerrechte/);
  env.document.isOwner = true;
  env.document.setFlag = async () => { throw new Error('write failed'); };
  await assert.rejects(saveFocus(env.document, 0), /write failed/);
  assert.equal(characterFocus(getCharacter(env.document)), 2);
});

test('Geographie uses saved totals and current attributes, ignoring default and selected copies', () => {
  const data = normalizeCharacter(fixture());
  const geo = data.checks.filter(check => check.name === 'Geographie');
  assert.equal(geo.length, 1);
  assert.equal(buildCommand(geo[0]), '/skillcheck Geographie | Klugheit 16 | Klugheit 16 | Intuition 14 | 8');
  assert.equal(buildCommand(data.checks.find(check => check.name === 'Schach')), '/skillcheck Schach | Klugheit 16 | Klugheit 16 | Intuition 14 | 0');
});
test('Secondary attributes use the same trio as Pedipalpus', () => {
  assert.equal(buildCommand(normalizeCharacter(fixture()).checks.find(check => check.id === 'secondary:0')),
    '/skillcheck Geistige Magieresistenz | Mut 15 | Klugheit 16 | Intuition 14 | 1');
});
test('Original table separates foundation and specialization values from the roll total', () => {
  const data = normalizeCharacter(fixture());
  const geo = data.checks.find(check => check.name === 'Geographie');
  assert.equal(geo.foundation, 'Derekunde');
  assert.equal(geo.foundationValue, 4);
  assert.equal(geo.specializationValue, 4);
  assert.equal(geo.value, 8);
});
test('The original diary list and condition states survive import as plain text', () => {
  const raw = fixture();
  raw.Notes = [{ Title: 'Ereignis', Description: '<script>bad()</script>', Date: '12.10.2026' }];
  raw.SimpleConditions = [{ Name: 'Begehren', IsActive: true }];
  raw.ComplexConditions = [{ Name: 'Angst', Level: 2 }];
  const data = normalizeCharacter(raw);
  assert.equal(data.journal[0].title, 'Ereignis');
  assert.equal(data.conditions.simple[0].active, true);
  assert.equal(data.conditions.complex[0].level, 2);
  const html = renderView({ actors: [], actor: { isOwner: true }, character: data, status: { ready: true, message: 'Verbunden' }, canImport: true, token: null });
  assert.ok(!html.includes('Ereignis'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('data-edit='));
});
test('Older 0.1 imports can still be displayed after the interface update', () => {
  const data = normalizeCharacter(fixture());
  for (const key of ['journal', 'secondary', 'conditions', 'combat', 'money']) delete data[key];
  for (const check of data.checks) for (const key of ['foundation', 'foundationValue', 'specializationValue', 'category']) delete check[key];
  const html = renderView({ actors: [], actor: { isOwner: true }, character: data, status: { ready: true, message: 'Verbunden' }, canImport: true, token: null });
  assert.ok(html.includes('Geographie'));
  assert.ok(html.includes('Derekunde'));
  assert.equal(buildCommand(data.checks.find(check => check.name === 'Geographie')), '/skillcheck Geographie | Klugheit 16 | Klugheit 16 | Intuition 14 | 8');
});
test('Incomplete and unnecessary probes are disabled with a reason', () => {
  const data = normalizeCharacter(fixture());
  assert.throws(() => buildCommand(data.checks.find(check => check.name === 'Noch undefiniert')), /nicht vollständig/);
  assert.throws(() => buildCommand(data.checks.find(check => check.name === 'Ohne Probe')), /keine Probe/);
});
test('Malformed, oversized and unrelated JSON rejected; newer versions have a visible warning', () => {
  assert.throws(() => parseCharacter('[]'), /keine vollständige/);
  assert.throws(() => parseCharacter('{'), /gültiges JSON/);
  assert.throws(() => parseCharacter(' '.repeat(MAX_FILE_SIZE + 1)), /5 MB/);
  assert.equal(parseCharacter('\uFEFF' + JSON.stringify(fixture())).sourceVersion, 17);
  const next = fixture(); next.Version = 18;
  assert.match(normalizeCharacter(next).warnings[0], /18/);
});
test('Chat control characters cannot inject an additional command', () => {
  for (const name of ['Geographie | 9', 'Geographie\n/roll 1d20']) {
    assert.throws(() => buildCommand({ name, value: 8, kind: 'attribute' }), /ungültige/);
  }
});
test('Character content is rendered as text, with no executable HTML', () => {
  const data = normalizeCharacter(fixture());
  data.profile.name = '<img src=x onerror=bad()>';
  data.checks.find(check => check.name === 'Geographie').name = '<script>bad()</script>';
  const html = renderView({ actors: [{ id: 'a', name: '<b>Actor</b>', hasCharacter: true }], actor: { id: 'a', isOwner: true }, character: data,
    status: { ready: true, message: 'Verbunden' }, canImport: true, token: null });
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('data-action="roll"'));
});

function runtime(version = '1.0.8') {
  const commands = {}, hooks = {}, messages = [], calls = [];
  const state = { modifier: { difficulty: 0, relief: 0, hidden: false }, dice: [17, 10, 16], dialogs: 0 };
  const document = {
    id: 'actor-a', name: 'Severus', isOwner: true, flags: { thirdParty: { value: 7 } },
    canUserModify: () => true, getFlag(namespace, key) { return this.flags[namespace]?.[key]; },
    async setFlag(namespace, key, data) { this.flags[namespace] ??= {}; this.flags[namespace][key] = structuredClone(data); }
  };
  globalThis.game = { system: { id: 'worldbuilding' }, user: { id: 'player', isGM: false }, users: [{ id: 'gm', isGM: true }],
    actors: { get: id => id === document.id ? document : null },
    modules: new Map([['ucurifunke-checks', { active: true, version }]]) };
  globalThis.foundry = {
    applications: { sidebar: { tabs: { ChatLog: { CHAT_COMMANDS: commands } } }, api: { DialogV2: { async input() { state.dialogs++; return state.modifier; } } } },
    utils: { isNewerVersion: (a, b) => a.localeCompare(b, undefined, { numeric: true }) > 0, escapeHTML: value => value.replace(/[<>]/g, x => x === '<' ? '&lt;' : '&gt;') },
    dice: { Roll: class {
      constructor(formula) { this.formula = formula; }
      async evaluate() {
        const values = this.formula === '1d20' ? [state.dice[0]] : state.dice;
        this.dice = [{ faces: 20, results: values.map(result => ({ result })) }];
        this.total = values.reduce((sum, value) => sum + value, 0);
        return this;
      }
    } },
    documents: {
      ChatMessage: { getSpeaker: ({ actor, token, scene } = {}) => ({ actor: actor?.id, token: token?.id, scene: scene?.id }),
        applyMode: (data, mode) => { data.rollModeApplied = true; data.mode = mode; }, create: async data => { messages.push(data); } },
      Actor: { canUserCreate: () => true, create: async data => { calls.push(data); return { ...data, id: 'created' }; } }
    }
  };
  globalThis.CONST = { CHAT_MESSAGE_STYLES: { OTHER: 0 }, DOCUMENT_OWNERSHIP_LEVELS: { OWNER: 3 } };
  globalThis.ui = { notifications: { error: message => { throw new Error(message); } }, chat: {
    async processMessage(command, options) {
      calls.push({ command, options });
      for (const [key, handler] of Object.entries(commands)) {
        const match = command.match(handler.rgx);
        if (match) return handler.fn(key, match, options);
      }
      throw new Error('Unknown command');
    }
  } };
  const source = fs.readFileSync(new URL(`../../pedipalpus-checks/ucurifunke-v${version}/${version === '1.0.8' ? 'ucurifunke-checks/' : ''}scripts/ucurifunke-checks.js`, import.meta.url), 'utf8');
  vm.runInNewContext(source, { foundry, game, ui, CONST, console: { log() {} }, Hooks: { once: (key, fn) => { hooks[key] = fn; }, on() {} } });
  hooks.init(); hooks.ready?.();
  return { document, state, messages, calls };
}

test('Published 1.0.14 uses the current registry and accepts skills and attribute commands', async () => {
  const { document, messages, state } = runtime('1.0.14');
  assert.equal(connectionStatus().ready, true);
  const character = normalizeCharacter(fixture());
  await executeCheck(document, character.checks.find(check => check.name === 'Geographie'));
  await executeCheck(document, character.checks.find(check => check.kind === 'attribute'));
  assert.equal(messages.length, 2);
  assert.match(messages[0].content, /Geographie/);
  assert.match(messages[1].content, /Mut/);
  state.modifier = null;
  await executeCheck(document, character.checks[0]);
  assert.equal(messages.length, 2);
});

test('Actual published 1.0.8 handler receives our command and linked token speaker', async () => {
  const { document, messages, calls } = runtime();
  const check = normalizeCharacter(fixture()).checks.find(check => check.name === 'Geographie');
  await executeCheck(document, check, { id: 'token-a', actorId: document.id, actorLink: true, parent: { id: 'scene-a' } });
  assert.equal(calls[0].options.speaker.token, 'token-a');
  assert.equal(calls[0].options.speaker.scene, 'scene-a');
  assert.match(messages[0].content, /Qualität: <strong>5<\/strong>/);
  assert.equal(messages[0].rollModeApplied, true);
});
test('No unrelated controlled token is used for Actor-only rolls', async () => {
  const { document, calls } = runtime();
  const check = normalizeCharacter(fixture()).checks[0];
  await executeCheck(document, check);
  assert.deepEqual(calls[0].options.speaker, { actor: document.id, alias: document.name });
  await assert.rejects(executeCheck(document, check, { actorId: 'wrong', actorLink: true }), /verknüpft/);
});
test('The existing module retains modifier, hidden-roll and cancellation behavior', async () => {
  const { document, state, messages } = runtime();
  const check = normalizeCharacter(fixture()).checks.find(check => check.name === 'Geographie');
  state.modifier = { difficulty: 10, relief: 0, hidden: true };
  await executeCheck(document, check);
  assert.match(messages[0].content, /Qualität: <strong>-7<\/strong>/);
  assert.equal(messages[0].blind, true);
  assert.equal(messages[0].flags['ucurifunke-checks'].hiddenCheck.name, 'Geographie');
  state.modifier = null;
  await executeCheck(document, check);
  assert.equal(messages.length, 1);
});
test('Missing module and insufficient ownership fail before posting a roll', async () => {
  const { document, calls } = runtime();
  document.isOwner = false;
  await assert.rejects(executeCheck(document, normalizeCharacter(fixture()).checks[0]), /Besitzerrechte/);
  document.isOwner = true;
  game.modules.get('ucurifunke-checks').active = false;
  assert.equal(connectionStatus().ready, false);
  await assert.rejects(executeCheck(document, normalizeCharacter(fixture()).checks[0]), /aktivieren/);
  assert.equal(calls.length, 0);
});
test('Reimport replaces removed equipment, retaining Actor ID, name and unrelated flags', async () => {
  const { document } = runtime();
  await saveCharacter(normalizeCharacter(fixture()), document.id);
  assert.equal(getCharacter(document).equipment.length, 1);
  const changed = fixture(); changed.MeleeWeapons = []; changed.AcademicSkills[0].Subskills[0].TotalValue = 9;
  const updated = await saveCharacter(normalizeCharacter(changed), document.id);
  assert.equal(updated, document);
  assert.equal(document.name, 'Severus');
  assert.equal(document.flags.thirdParty.value, 7);
  assert.equal(getCharacter(document).equipment.length, 0);
  assert.equal(getCharacter(document).checks.find(check => check.name === 'Geographie').value, 9);
});
test('Import rejects missing write permission before changing stored data', async () => {
  const { document } = runtime();
  document.canUserModify = () => false;
  await assert.rejects(saveCharacter(normalizeCharacter(fixture()), document.id), /Besitzerrechte/);
  assert.equal(document.flags[MODULE_ID], undefined);
});
test('Corrupt stored snapshots are treated as missing imports', () => {
  runtime();
  assert.equal(getCharacter({ getFlag: () => ({ schemaVersion: 1, profile: { name: 'Broken' }, checks: [], attributes: [], equipment: [] }) }), null);
});
test('New characters have linked prototype tokens and owner permission', async () => {
  const { calls } = runtime();
  const actor = await saveCharacter(normalizeCharacter(fixture()));
  assert.equal(actor.prototypeToken.actorLink, true);
  assert.equal(actor.ownership.player, 3);
  assert.equal(calls.length, 1);
});
test('Token linking requires rights and explicit acceptance of an unlinked sheet', async () => {
  const { document } = runtime();
  await saveCharacter(normalizeCharacter(fixture()), document.id);
  const updates = [];
  const token = { actorId: document.id, actorLink: false, canUserModify: () => true, update: async change => updates.push(change) };
  await assert.rejects(linkToken(document, token), /bestätigen/);
  await linkToken(document, token, true);
  assert.deepEqual(updates, [{ actorId: document.id, actorLink: true }]);
  token.actorId = 'other';
  await assert.rejects(linkToken(document, token, true), /anderen Charakter/);
});
test('The real user file reconstructs the supplied command when provided', { skip: !process.env.PEDIPALPUS_REAL_CHARACTER }, () => {
  const data = parseCharacter(fs.readFileSync(process.env.PEDIPALPUS_REAL_CHARACTER, 'utf8'));
  assert.equal(buildCommand(data.checks.find(check => check.name === 'Geographie')), '/skillcheck Geographie | Klugheit 16 | Klugheit 16 | Intuition 14 | 8');
});


test('Compact view contains only rollable checks and no character editor', () => {
  const data = normalizeCharacter(fixture());
  const before = JSON.stringify(data);
  const html = renderView({ actors: [], actor: { isOwner: true }, character: data, status: { ready: true, message: 'Verbunden' }, canImport: true, token: null });
  assert.ok(html.includes('Geographie'));
  assert.ok(!html.includes('Noch undefiniert'));
  assert.ok(!html.includes('Ohne Probe'));
  for (const removed of ['Biografie', 'Inventar', 'Abenteuerpunkte', 'data-edit=', 'data-action="save"', 'data-action="discard"', 'name="category" type="radio"']) assert.ok(!html.includes(removed), removed);
  assert.ok(html.includes('aria-label="Probenbereich"'));
  assert.equal(JSON.stringify(data), before);
  assert.equal(rollableChecks(data).length, data.checks.filter(check => !check.reason).length);
});

test('Read-only users cannot roll; unavailable command connection also disables roll buttons', () => {
  const character = normalizeCharacter(fixture());
  for (const [owner, ready] of [[false, true], [true, false]]) {
    const html = renderView({ actors: [], actor: { isOwner: owner }, character, status: { ready, message: 'Status' }, canImport: false, token: null });
    const buttons = html.match(/<button[^>]+data-action="roll"[^>]*>/g);
    assert.ok(buttons.length > 0);
    assert.ok(buttons.every(button => button.includes('disabled')));
  }
});

for (const version of ['1.0.8', '1.0.14']) {
  test(`Direct rolls preserve ${version} difficulty, relief and blind behavior without a dialog`, async () => {
    const { document, state, messages } = runtime(version);
    const character = normalizeCharacter(fixture());
    const skill = character.checks.find(check => check.name === 'Geographie');
    const attribute = character.checks.find(check => check.kind === 'attribute');
    const original = foundry.applications.api.DialogV2.input;
    await executeCheck(document, skill, null, { modifier: 10, blind: true });
    assert.equal(foundry.applications.api.DialogV2.input, original);
    assert.equal(state.dialogs, 0);
    assert.match(messages[0].content, /Qualität: <strong>-7<\/strong>/);
    assert.match(messages[0].content, /Erschwernis: <strong>10<\/strong>/);
    assert.equal(version === '1.0.8' ? messages[0].blind : messages[0].mode === 'blind', true);
    assert.equal(messages[0].flags['ucurifunke-checks'].hiddenCheck[version === '1.0.8' ? 'name' : 'subject'], 'Geographie');
    await executeCheck(document, skill, null, { modifier: -20, blind: false });
    assert.match(messages[1].content, /Erleichterung: <strong>20<\/strong>/);
    assert.match(messages[1].content, /Qualität: <strong>8<\/strong>/);
    await executeCheck(document, attribute, null, { modifier: -20, blind: true });
    assert.match(messages[2].content, /Qualität: <strong>15<\/strong>/);
    assert.equal(state.dialogs, 0);
    await executeCheck(document, skill);
    assert.equal(state.dialogs, 1);
  });
}

test('Direct adapter restores dialog method before rolling and after rejected or failed commands', async () => {
  const { document, state, messages } = runtime('1.0.14');
  const original = foundry.applications.api.DialogV2.input;
  const check = normalizeCharacter(fixture()).checks.find(check => check.name === 'Geographie');
  const Roll = foundry.dice.Roll;
  foundry.dice.Roll = class extends Roll { async evaluate() {
    assert.equal(foundry.applications.api.DialogV2.input, original);
    throw new Error('Testfehler');
  } };
  await assert.rejects(executeCheck(document, check, null, { modifier: 2 }), /Testfehler/);
  assert.equal(foundry.applications.api.DialogV2.input, original);
  await assert.rejects(executeCheck(document, check, null, { modifier: 1.5 }), /ganze Zahl/);
  game.modules.get('ucurifunke-checks').version = '1.0.15';
  await assert.rejects(executeCheck(document, check, null, { modifier: 0, blind: true }), /aktualisierte/);
  assert.equal(messages.length, 0);
  assert.equal(state.dialogs, 0);
});

test('Unrelated synchronous dialogs are forwarded and retain their receiver', async () => {
  const { document, state } = runtime('1.0.14');
  const check = normalizeCharacter(fixture()).checks[0];
  const registry = foundry.applications.sidebar.tabs.ChatLog.CHAT_COMMANDS;
  const prior = registry.attributecheck.fn;
  registry.attributecheck.fn = function(...args) {
    foundry.applications.api.DialogV2.input({ window: { title: 'Anderer Dialog' } });
    return prior.apply(this, args);
  };
  await executeCheck(document, check, null, { modifier: 0 });
  assert.equal(state.dialogs, 1);
});

test('Talent and attribute mastery use independent scales without changing imported roll values', () => {
  const character = normalizeCharacter(fixture());
  const skill = character.checks.find(check => check.name === 'Geographie');
  const before = JSON.stringify(character);
  assert.equal(mastery({ ...skill, value: 0 }).grade, 'untrained');
  assert.equal(mastery({ ...skill, value: -2 }).grade, 'untrained');
  assert.equal(mastery({ ...skill, value: 9 }).grade, 'adept');
  assert.equal(mastery({ ...skill, value: 10 }).grade, 'master');
  assert.equal(mastery({ ...skill, value: 20 }).progress, 1);
  assert.ok(mastery({ ...skill, value: 5 }).progress > mastery({ ...skill, value: 4 }).progress);
  const primary = character.checks.find(check => check.kind === 'attribute');
  assert.equal(mastery({ ...primary, value: 1 }).label, 'Sehr schwach');
  assert.equal(mastery({ ...primary, value: 10 }).label, 'Durchschnittlich');
  assert.notEqual(mastery({ ...primary, value: 19 }).grade, 'master');
  assert.equal(mastery({ ...primary, value: 20 }).grade, 'master');
  assert.equal(mastery(character.checks.find(check => check.id.startsWith('secondary:'))).grade, 'attribute');
  assert.equal(mastery(combatCheck('attack', {skillValue:10,baseValue:0,focusValue:-4})).grade, 'master');
  assert.equal(mastery(combatCheck('parry', {skillValue:0,baseValue:15,focusValue:5})).grade, 'untrained');
  assert.equal(mastery({...combatCheck('attack', {skillValue:20}),id:'animals:0:0:attack'}).grade, 'attribute');
  const html = renderView({actors:[], actor:{isOwner:true}, character, status:{ready:true,message:'Verbunden'}, canImport:true});
  assert.match(html, /data-theme="fantasy"/);
  assert.match(html, /data-grade="untrained"/);
  assert.equal(JSON.stringify(character), before);
  assert.equal(buildCommand(skill), '/skillcheck Geographie | Klugheit 16 | Klugheit 16 | Intuition 14 | 8');
});

const combatCheck = (type = 'attack', changes = {}) => {
  const combat = { type, weaponName: 'Testwaffe', skillName: type === 'ranged' ? 'Armbrüste' : 'Fechtwaffen',
    skillValue: 5, baseValue: 6, focusValue: type === 'ranged' ? 0 : -2, weaponModifier: 1, mobilityPenalty: 2, ...changes };
  return { id: `combat:${type}`, name: 'Testwaffe', kind: 'combat', attributes: [], combat,
    value: combat.skillValue + combat.baseValue + combat.focusValue + combat.weaponModifier - combat.mobilityPenalty };
};

test('Combat commands include skill, basis, signed focus, weapon modifier and effective BE', async () => {
  const {document, messages, state} = runtime('1.0.14');
  assert.equal(connectionStatus().combatReady, true);
  assert.equal(buildCommand(combatCheck()), '/AT Testwaffe|Fechtwaffen|5|6|-2|1|2');
  assert.equal(buildCommand(combatCheck('parry')), '/PA Testwaffe|Fechtwaffen|5|6|-2|1|2');
  assert.equal(buildCommand(combatCheck('ranged')), '/FK Testwaffe|Armbrüste|5|6|1|2');
  for (const type of ['attack','parry','ranged']) await executeCheck(document, combatCheck(type), null, {modifier:3,blind:true});
  assert.equal(messages.length, 3);
  assert.equal(state.dialogs, 0);
  assert.ok(messages.every(message => message.mode === 'blind'));
  assert.match(messages[0].content, /Testwaffe/);
  assert.match(messages[1].content, /Parade/);
  assert.match(messages[2].content, /Fernkampf/);
});

test('Old probes module and invalid combat data cannot silently produce a different roll', async () => {
  const {document, calls} = runtime();
  await assert.rejects(executeCheck(document, combatCheck(), null, {modifier:0}), /1.0.14/);
  assert.equal(calls.length, 0);
  assert.throws(() => buildCommand(combatCheck('attack', {mobilityPenalty:-1})), /widersprüchliche/);
  assert.throws(() => buildCommand(combatCheck('attack', {weaponName:'Waffe|9'})), /widersprüchliche/);
  assert.throws(() => buildCommand(combatCheck('ranged', {focusValue:2})), /widersprüchliche/);
  const check = combatCheck();check.value++;
  assert.throws(() => buildCommand(check), /widersprüchliche/);
});

test('Combat critical rolls are confirmed by the actual probes module', async () => {
  const {document,state,messages} = runtime('1.0.14');
  state.dice = [1];
  await executeCheck(document,combatCheck(),null,{modifier:0});
  assert.equal(messages[0].rolls.length,2);
  assert.match(messages[0].content,/Kritischer Erfolg/);
  state.dice = [20];
  await executeCheck(document,combatCheck(),null,{modifier:0});
  assert.equal(messages[1].rolls.length,2);
  assert.match(messages[1].content,/Patzer/);
});

test('Updated saved data matches Pedipalpus best technique, BE tolerance and shield defense; animals use finished values', () => {
  const raw = combatFixture();
  const checks = normalizeCharacter(raw).checks;
  const command = id => buildCommand(checks.find(check => check.id === id));
  assert.equal(command('combat:MeleeWeapons:0:attack'), '/AT Rapier|Schwerter|6|5|-4|0|4');
  assert.equal(command('combat:MeleeWeapons:0:parry'), '/PA Rapier|Schwerter|6|5|4|1|4');
  assert.equal(command('combat:ParryWeapons:0:parry'), '/PA Schild|Schwerter|6|5|4|3|3');
  assert.equal(command('combat:RangedWeapons:0:ranged'), '/FK Armbrust|Armbrüste|5|6|0|3');
  assert.equal(command('animals:0:0:attack'), '/AT Wolf – Biss|Biss|14|0|0|0|0');
  assert.equal(command('animals:0:0:parry'), '/PA Wolf – Biss|Biss|7|0|0|0|0');
  raw.MeleeSkills[0].Value = 6;
  assert.equal(normalizeCharacter(raw).checks.find(check => check.id === 'combat:MeleeWeapons:0:attack').combat.skillName, 'Fechtwaffen');
  delete raw.Be;
  assert.ok(normalizeCharacter(raw).checks.find(check => check.id === 'combat:MeleeWeapons:0:attack').reason);
});

test('Portrait import updates only the chosen actor and linked editable tokens, preserving other artwork', async () => {
  const {document} = runtime();
  const updates = [];
  document.update = async value => { updates.push({actor:value}); };
  const token = (actorId,actorLink,editable) => ({actorId,actorLink,canUserModify:() => editable,update:async value => updates.push({token:value})});
  game.scenes = {contents:[{tokens:{contents:[token(document.id,true,true),token(document.id,false,true),token('other',true,true),token(document.id,true,false)]}}]};
  ui.notifications.warn = message => updates.push({warning:message});
  await applyPortrait(document,'worlds/test/portrait.png');
  assert.deepEqual(updates[0],{actor:{img:'worlds/test/portrait.png','prototypeToken.texture.src':'worlds/test/portrait.png'}});
  assert.deepEqual(updates[1],{token:{'texture.src':'worlds/test/portrait.png'}});
  assert.equal(updates.length,3);
  assert.match(updates[2].warning,/1 verknüpfte Tokens/);
  document.canUserModify = () => false;
  await assert.rejects(applyPortrait(document,'other.png'),/Besitzerrechte/);
  assert.equal(updates.length,3);
});

test('Portrait upload checks bytes, owner/upload permission and world folder; same image is reused', async () => {
  runtime();
  await assert.rejects(preparePortrait(new File(['<svg></svg>'],'bild.png',{type:'image/png'})),/PNG/);
  globalThis.createImageBitmap = async () => ({close(){}});
  const file = new File([new Uint8Array([137,80,78,71,13,10,26,10])],'bild.png',{type:'image/png'});
  const prepared = await preparePortrait(file);
  await assert.rejects(uploadPortrait(prepared),/Upload-Rechte/);
  game.user.can = () => true;game.world={id:'test'};
  let uploadCount = 0;const files=[];const dirs=[];
  foundry.applications.apps={FilePicker:{implementation:{browse:async (_source,path) => ({files:path.endsWith('portraits') ? files : [],dirs}),
    createDirectory:async (_source,path) => dirs.push(path), upload:async (_source,path,file) => {uploadCount++;const dest=`${path}/${file.name}`;files.push(dest);return {path:dest};}}}};
  const path = await uploadPortrait(prepared);
  assert.match(path,/^worlds\/test\/pedipalpus-portraits\/[a-f0-9]{64}\.png$/);
  assert.equal(await uploadPortrait(prepared),path);
  assert.equal(uploadCount,1);
  game.world.id = '../unsafe';
  await assert.rejects(uploadPortrait(prepared),/Welt/);
});
