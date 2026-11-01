import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCharacter} from '../scripts/data.js';
import {companionKey,companionSnapshot} from '../scripts/companions.js';
import {memberStateKey} from '../scripts/play-state.js';
import {playStateDialog} from '../scripts/play-tools.js';
import {retinueFixture} from './fixture.js';
function runtime(){
 const raw=retinueFixture(),character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)},actors=[];let dialogs=0,writes=0;
 const make=(id,character,companion)=>({id,name:character.profile.name,isOwner:true,flags:{character,companion},getFlag(_namespace,key){return this.flags[key];},canUserModify:()=>true,async setFlag(_namespace,key,value){writes++;this.flags[key]=structuredClone(value);}});
 const parent=make('parent',character),child=make('child',companionSnapshot(character,0),{sourceActorId:'parent',key:companionKey(character,0)});actors.push(parent,child);
 globalThis.game={user:{id:'owner'},actors:{contents:actors,get:id=>actors.find(row=>row.id===id)}};globalThis.ui={notifications:{warn(){}}};
 let answer=()=>false;
 globalThis.foundry={applications:{api:{DialogV2:{async wait(config){dialogs++;return answer(config);}}}}};
 return {parent,child,actors,character,key:memberStateKey(character.retinue[0]),app:{actor:child,t:text=>text,dialogClasses:[],async render(){}},answer:fn=>{answer=fn;},counts:()=>({dialogs,writes})};
}

test('Replaced and missing-parent companions fail before opening an unusable energy dialog',async()=>{
 const r=runtime();r.child.flags.companion.active=false;await assert.rejects(playStateDialog(r.app),/wurde ersetzt/);r.child.flags.companion.active=true;r.actors.splice(r.actors.indexOf(r.parent),1);await assert.rejects(playStateDialog(r.app),/Hauptcharakter.*nicht mehr vorhanden/);assert.deepEqual(r.counts(),{dialogs:0,writes:0});
});

test('Missing or ambiguous companion membership never falls back to another creature or the parent energies',async()=>{
 const r=runtime();r.child.flags.companion.key='id:missing';await assert.rejects(playStateDialog(r.app),/nicht mehr eindeutig/);
 r.child.flags.companion.key=companionKey(r.character,0);const raw=JSON.parse(r.character.sourceJSON);raw.Animals.push({...raw.Animals[0]});r.parent.flags.character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};
 await assert.rejects(playStateDialog(r.app),/nicht mehr eindeutig/);assert.deepEqual(r.counts(),{dialogs:0,writes:0});
});

test('Changed links, deleted actors and lost child permissions reject an already open dialog without energy writes',async()=>{
 for(const mutate of [r=>{r.child.flags.companion.active=false;},r=>{r.child.flags.companion.key='id:another';},r=>{r.child.flags.companion.sourceActorId='another-parent';},r=>{r.actors.splice(r.actors.indexOf(r.child),1);},r=>{r.actors.splice(r.actors.indexOf(r.parent),1);},r=>{r.child.isOwner=false;}]){
  const r=runtime();r.answer(()=>{mutate(r);return {version:1,resources:{[r.key]:{LE:2}}};});
  await assert.rejects(playStateDialog(r.app),/inzwischen geändert|Besitzerrechte/);assert.deepEqual(r.counts(),{dialogs:1,writes:0});assert.equal(r.parent.flags.character.retinue[0].CurrentLe,14);
 }
});

test('Changing only the token frame does not invalidate an otherwise unchanged companion energy dialog',async()=>{
 const r=runtime();r.answer(config=>{assert.match(config.content,/Skelett/);r.child.flags.companion.tokenStyle='undead';return {version:1,resources:{[r.key]:{LE:2}}};});
 await playStateDialog(r.app);assert.equal(r.parent.flags.character.retinue[0].CurrentLe,2);assert.equal(r.parent.flags.character.resources[0].value,31);assert.equal(r.child.flags.character.resources[0].value,2);
});

test('Cancelling an open dialog after a link changes performs no writes and needs no forced save',async()=>{
 const r=runtime();r.answer(()=>{r.child.flags.companion.active=false;return false;});await playStateDialog(r.app);assert.deepEqual(r.counts(),{dialogs:1,writes:0});
});

test('An invalid parent import produces an actionable error before opening a dialog',async()=>{
 const r=runtime();r.parent.flags.character=null;await assert.rejects(playStateDialog(r.app),/erneut importieren/);assert.deepEqual(r.counts(),{dialogs:0,writes:0});
});
