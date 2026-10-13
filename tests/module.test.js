import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fixture } from './fixture.js';
import { parseCharacter, normalizeCharacter, MODULE_ID, FLAG, MAX_FILE_SIZE } from '../scripts/data.js';
import { buildCommand, connectionStatus, executeCheck } from '../scripts/commands.js';
import { saveCharacter, getCharacter, linkToken } from '../scripts/storage.js';
import { renderView } from '../scripts/view.js';

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
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
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
  const html = renderView({ actors: [{ id: 'a', name: '<b>Actor</b>', hasCharacter: true }], actor: { id: 'a', isOwner: true }, character: data,
    status: { ready: true, message: 'Verbunden' }, canImport: true, token: null });
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('data-action="roll"'));
});

function runtime() {
  const commands = {}, hooks = {}, messages = [], calls = [];
  const state = { modifier: { difficulty: 0, relief: 0, hidden: false }, dice: [17, 10, 16] };
  const document = {
    id: 'actor-a', name: 'Severus', isOwner: true, flags: { thirdParty: { value: 7 } },
    canUserModify: () => true, getFlag(namespace, key) { return this.flags[namespace]?.[key]; },
    async setFlag(namespace, key, data) { this.flags[namespace] ??= {}; this.flags[namespace][key] = structuredClone(data); }
  };
  globalThis.game = { system: { id: 'worldbuilding' }, user: { id: 'player', isGM: false }, users: [{ id: 'gm', isGM: true }],
    actors: { get: id => id === document.id ? document : null },
    modules: new Map([['ucurifunke-checks', { active: true, version: '1.0.8' }]]) };
  globalThis.foundry = {
    applications: { sidebar: { tabs: { ChatLog: { CHAT_COMMANDS: commands } } }, api: { DialogV2: { async input() { return state.modifier; } } } },
    utils: { isNewerVersion: (a, b) => a.localeCompare(b, undefined, { numeric: true }) > 0, escapeHTML: value => value.replace(/[<>]/g, x => x === '<' ? '&lt;' : '&gt;') },
    dice: { Roll: class { async evaluate() { this.dice = [{ faces: 20, results: state.dice.map(result => ({ result })) }]; return this; } } },
    documents: {
      ChatMessage: { getSpeaker: ({ actor, token, scene } = {}) => ({ actor: actor?.id, token: token?.id, scene: scene?.id }),
        applyMode: data => { data.rollModeApplied = true; }, create: async data => { messages.push(data); } },
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
  const source = fs.readFileSync(new URL('../../pedipalpus-checks/ucurifunke-v1.0.8/ucurifunke-checks/scripts/ucurifunke-checks.js', import.meta.url), 'utf8');
  vm.runInNewContext(source, { foundry, game, ui, CONST, console: { log() {} }, Hooks: { once: (key, fn) => { hooks[key] = fn; }, on() {} } });
  hooks.init(); hooks.ready();
  return { document, state, messages, calls };
}
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
