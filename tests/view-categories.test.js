import {test} from 'node:test';
import assert from 'node:assert/strict';
import {viewCategories} from '../scripts/view.js';
import {normalizeCharacter} from '../scripts/data.js';
import {fixture,npcFixture,retinueFixture} from './fixture.js';

test('Character view categories keep full probes separate from combat and companions',()=>{
 const character=normalizeCharacter(retinueFixture()),before=structuredClone(character),full=viewCategories(character),battle=viewCategories(character,'battle');
 assert.ok(full.has('attributes')&&full.has('AcademicSkills'));assert.equal(full.has('combat'),false);assert.equal(full.has('animals'),false);
 assert.ok(battle.has('combat')&&battle.has('animals')&&battle.has('demons')&&battle.has('undead')&&battle.has('armors'));assert.equal(battle.has('AcademicSkills'),false);assert.deepEqual(character,before);
});

test('NPC derived attributes use the visible attributes category, never their internal collection name',()=>{
 const categories=viewCategories(normalizeCharacter(npcFixture()));assert.ok(categories.has('attributes'));assert.equal(categories.has('NpcDerived'),false);assert.ok(categories.has('all')&&categories.has('favorites'));
});

test('Companion equipment remains accessible without rollable checks and missing characters are tolerated',()=>{
 const character={checks:[],equipment:[{id:'Undead:0:inventory:0'}]};assert.ok(viewCategories(character,'battle').has('undead'));
 assert.deepEqual([...viewCategories(null)],['all','favorites']);assert.equal(viewCategories(normalizeCharacter(fixture())).has('missing'),false);
});
