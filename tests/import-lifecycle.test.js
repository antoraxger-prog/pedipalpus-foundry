import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCharacter} from '../scripts/data.js';
import {fixture} from './fixture.js';
import {saveCharacter,matchesWrittenSnapshot} from '../scripts/storage.js';

function runtime(){
 const snapshot=normalizeCharacter(fixture()),flags={character:structuredClone(snapshot)},counts={flags:0,updates:0,creates:0},actors=new Map();
 const actor={id:'hero',img:'original.png',prototypeToken:{texture:{src:'original-token.png'}},canUserModify:()=>true,getFlag:(_ns,key)=>flags[key],async setFlag(_ns,key,value){counts.flags++;flags[key]=structuredClone(value);},async update(){counts.updates++;}};
 actors.set(actor.id,actor);globalThis.game={system:{id:'worldbuilding'},world:{id:'test-world'},user:{id:'owner',isGM:true},users:[{id:'player'}],actors:{get:id=>actors.get(id)},scenes:{contents:[]}};
 globalThis.CONST={DOCUMENT_OWNERSHIP_LEVELS:{OWNER:3}};
 globalThis.foundry={documents:{Actor:{canUserCreate:()=>true,async create(data){counts.creates++;return data;}}},applications:{apps:{FilePicker:{implementation:{browse:async()=>({dirs:['worlds/test-world/pedipalpus-portraits'],files:[]}),upload:async()=>({path:'worlds/test-world/pedipalpus-portraits/upload.png'})}}}}};
 return {snapshot,flags,counts,actors,actor,portrait:{file:new File(['picture'],'portrait.png',{type:'image/png'}),extension:'png'}};
}

test('Removing or replacing an import target during upload stops before the character flag is written',async()=>{
 for(const change of [r=>r.actors.delete(r.actor.id),r=>r.actors.set(r.actor.id,{...r.actor})]){
  const r=runtime();foundry.applications.apps.FilePicker.implementation.upload=async()=>{change(r);return {path:'uploaded.png'};};
  await assert.rejects(saveCharacter(r.snapshot,r.actor.id,r.portrait,()=>{},JSON.stringify(r.snapshot)),/Importfigur.*entfernt oder ersetzt/);assert.deepEqual(r.counts,{flags:0,updates:0,creates:0});
 }
});

test('A newer character written during the import flag save is preserved without image or owner updates',async()=>{
 const r=runtime(),set=r.actor.setFlag.bind(r.actor);r.actor.setFlag=async(...args)=>{await set(...args);r.flags.character.checks[0].value=19;};
 await assert.rejects(saveCharacter(r.snapshot,r.actor.id,r.portrait,()=>{},JSON.stringify(r.snapshot),{ownerId:'player'}),/Daten wurden inzwischen geändert/);
 assert.equal(r.flags.character.checks[0].value,19);assert.deepEqual(r.counts,{flags:1,updates:0,creates:0});assert.equal(r.actor.img,'original.png');
});

test('A removed figure or lost permission after saving stops all later import updates',async()=>{
 for(const change of [r=>r.actors.delete(r.actor.id),r=>{r.actor.canUserModify=()=>false;}]){
  const r=runtime(),set=r.actor.setFlag.bind(r.actor);r.actor.setFlag=async(...args)=>{await set(...args);change(r);};
  await assert.rejects(saveCharacter(r.snapshot,r.actor.id,r.portrait,()=>{},JSON.stringify(r.snapshot)),/Importfigur|Besitzerrechte/);assert.deepEqual(r.counts,{flags:1,updates:0,creates:0});
 }
});

test('New-character creation rights are checked again after image upload',async()=>{
 const r=runtime();foundry.applications.apps.FilePicker.implementation.upload=async()=>{foundry.documents.Actor.canUserCreate=()=>false;return {path:'uploaded.png'};};
 await assert.rejects(saveCharacter(r.snapshot,null,r.portrait),/keine Charaktere anlegen/);assert.equal(r.counts.creates,0);
});

test('A deleted assignee or lost GM role during upload cannot be used for a new actor',async()=>{
 for(const change of [()=>{game.users=[];},()=>{game.user.isGM=false;}]){
  const r=runtime();foundry.applications.apps.FilePicker.implementation.upload=async()=>{change();return {path:'uploaded.png'};};
  await assert.rejects(saveCharacter(r.snapshot,null,r.portrait,()=>{},undefined,{ownerId:'player'}),/Spieler|Spielleiter/);assert.equal(r.counts.creates,0);
 }
});

test('Post-write verification ignores object key order and untouched extras while checking every written field and array entry',()=>{
 assert.equal(matchesWrittenSnapshot({b:{old:true,x:2},a:[{value:1,extra:'kept'}],extra:9},{a:[{value:1}],b:{x:2}}),true);
 for(const current of [{a:[{value:2}],b:{x:2}},{a:[{value:1},{value:1}],b:{x:2}},{a:[{value:1}],b:{}},{a:{0:{value:1}},b:{x:2}}])assert.equal(matchesWrittenSnapshot(current,{a:[{value:1}],b:{x:2}}),false);
});

test('A legitimate import with reordered and merged object fields completes without a false conflict',async()=>{
 const r=runtime(),set=r.actor.setFlag.bind(r.actor);r.actor.setFlag=async(...args)=>{await set(...args);r.flags.character=Object.fromEntries(Object.entries(r.flags.character).reverse());r.flags.character.profile.untouched='preserved';};
 await saveCharacter(r.snapshot,r.actor.id,null,()=>{},JSON.stringify(r.snapshot));assert.equal(r.counts.flags,1);assert.equal(r.flags.character.profile.untouched,'preserved');assert.equal(r.counts.updates,0);
});

test('Actor removal during the image update stops a later owner assignment',async()=>{
 const r=runtime();r.actor.update=async()=>{r.counts.updates++;r.actors.delete(r.actor.id);};
 await assert.rejects(saveCharacter(r.snapshot,r.actor.id,r.portrait,()=>{},JSON.stringify(r.snapshot),{ownerId:'player'}),/Importfigur.*entfernt/);
 assert.deepEqual(r.counts,{flags:1,updates:1,creates:0});
});
