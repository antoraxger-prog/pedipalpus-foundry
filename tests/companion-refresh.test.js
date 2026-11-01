import {test} from 'node:test';
import assert from 'node:assert/strict';
import {retinueFixture} from './fixture.js';
import {normalizeCharacter} from '../scripts/data.js';
import {memberStateKey} from '../scripts/play-state.js';
import {savePlayState} from '../scripts/storage.js';
import {playStateDialog} from '../scripts/play-tools.js';
import {companionKey,companionSnapshot,refreshCompanions} from '../scripts/companions.js';

const snapshot=raw=>({...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)});
function runtime(){
 const character=snapshot(retinueFixture()),actors=[],warnings=[];
 const actor=(id,data,companion)=>({id,name:data.profile.name,isOwner:true,img:`${id}.webp`,ownership:{player:3},writes:0,flags:{character:data,companion},getFlag(_ns,key){return this.flags[key];},canUserModify:()=>true,async setFlag(_ns,key,value){this.writes++;this.flags[key]=structuredClone(value);}});
 const parent=actor('parent',character),children=character.retinue.map((_row,index)=>actor(`child-${index}`,companionSnapshot(character,index),{sourceActorId:parent.id,key:companionKey(character,index)}));actors.push(parent,...children);
 globalThis.game={user:{id:'owner'},actors:{contents:actors,get:id=>actors.find(row=>row.id===id)}};globalThis.ui={notifications:{warn:message=>warnings.push(message)}};
 globalThis.foundry={applications:{api:{DialogV2:{async wait(){return {refreshOnly:true};}}}}};
 const warn=message=>warnings.push(message),app={actor:parent,t:text=>text,dialogClasses:[],notify:(_level,message)=>warn(message),async render(){}};
 return {parent,children,actors,warnings,warn,character,app};
}

test('A failed child synchronization keeps the saved parent successful and updates later children',async()=>{
 const r=runtime(),first=r.children[0];first.setFlag=async()=>{throw new Error('Synthetic child storage failure');};
 const state={version:1,resources:{root:{LE:9},...Object.fromEntries(r.character.retinue.map(member=>[memberStateKey(member),{LE:2}]))}},original=r.parent.flags.character.sourceJSON;
 const result=await savePlayState(r.parent,state,JSON.stringify(r.character));
 assert.equal(result.resources[0].value,9);assert.equal(r.parent.writes,1);assert.equal(first.writes,0);assert.equal(first.flags.character.resources[0].value,14);
 for(const child of r.children.slice(1)){assert.equal(child.writes,1);assert.equal(child.flags.character.resources[0].value,2);assert.equal(child.img,`${child.id}.webp`);assert.deepEqual(child.ownership,{player:3});}
 assert.equal(r.parent.flags.character.sourceJSON,original);assert.equal(r.warnings.length,1);assert.match(r.warnings[0],/Skelett.*erneut öffnen und speichern/);
});

test('Saving an unchanged play-state dialog retries failed children without writing the parent again',async()=>{
 const r=runtime(),first=r.children[0],save=first.setFlag.bind(first);first.setFlag=async()=>{throw new Error('Synthetic child storage failure');};
 await savePlayState(r.parent,{version:1,resources:{[memberStateKey(r.character.retinue[0])]:{LE:2}}},JSON.stringify(r.character));first.setFlag=save;
 const before=JSON.stringify(r.parent.flags.character);r.warnings.length=0;await playStateDialog(r.app);
 assert.equal(r.parent.writes,1);assert.equal(JSON.stringify(r.parent.flags.character),before);assert.equal(first.flags.character.resources[0].value,2);assert.deepEqual(r.warnings,[]);
});

test('Changed source data during a child write stops remaining stale updates and allows a fresh retry',async()=>{
 const r=runtime(),first=r.children[0],save=first.setFlag.bind(first);first.setFlag=async(...args)=>{await save(...args);const raw=JSON.parse(r.parent.flags.character.sourceJSON);raw.Demons[0].CurrentLe=7;r.parent.flags.character=snapshot(raw);};
 const result=await refreshCompanions(r.parent,r.warn);assert.deepEqual(result,{updated:1,failed:0,stopped:true});assert.equal(r.children[1].writes,0);assert.equal(r.children[2].writes,0);assert.match(r.warnings[0],/Hauptcharakter.*Weitere Begleiterwerte/);
 first.setFlag=save;const retried=await refreshCompanions(r.parent,r.warn);assert.deepEqual(retried,{updated:3,failed:0,stopped:false});assert.equal(r.children[1].flags.character.resources[0].value,7);
});

test('Deletion or lost edit rights on the source stop further child writes during a refresh',async()=>{
 for(const mutate of [r=>r.actors.splice(r.actors.indexOf(r.parent),1),r=>{r.parent.canUserModify=()=>false;},r=>{r.parent.flags.companion={sourceActorId:'other',key:'id:foreign'};}]){
  const r=runtime(),first=r.children[0],save=first.setFlag.bind(first);first.setFlag=async(...args)=>{await save(...args);mutate(r);};
  const result=await refreshCompanions(r.parent,r.warn);assert.equal(result.stopped,true);assert.equal(r.children[1].writes,0);assert.equal(r.children[2].writes,0);assert.equal(r.warnings.length,1);
 }
});

test('A failure to disable a removed companion does not block others and can be retried without deleting actors or images',async()=>{
 const r=runtime(),raw=JSON.parse(r.parent.flags.character.sourceJSON);raw.Animals=[];r.parent.flags.character=snapshot(raw);const first=r.children[0],save=first.setFlag.bind(first);first.setFlag=async()=>{throw new Error('Synthetic child storage failure');};
 const result=await refreshCompanions(r.parent,r.warn);assert.deepEqual(result,{updated:2,failed:1,stopped:false});assert.ok(first.flags.character.checks.length>0);first.setFlag=save;
 await refreshCompanions(r.parent,r.warn);assert.deepEqual(first.flags.character.checks,[]);assert.equal(first.img,'child-0.webp');assert.equal(game.actors.get(first.id),first);
});

test('Deleting a child during synchronization does not skip unrelated children in the live actor collection',async()=>{
 const r=runtime(),first=r.children[0],save=first.setFlag.bind(first);first.setFlag=async(...args)=>{await save(...args);r.actors.splice(r.actors.indexOf(first),1);};
 const result=await refreshCompanions(r.parent,r.warn);assert.equal(result.updated,3);assert.equal(r.children[1].writes,1);assert.equal(r.children[2].writes,1);assert.deepEqual(r.warnings,[]);
});

test('An actual parent-write failure still rejects before any child is touched',async()=>{
 const r=runtime();r.parent.setFlag=async()=>{throw new Error('Synthetic parent storage failure');};
 await assert.rejects(savePlayState(r.parent,{version:1,resources:{root:{LE:9}}},JSON.stringify(r.character)),/Synthetic parent storage failure/);assert.ok(r.children.every(child=>child.writes===0));assert.deepEqual(r.warnings,[]);
});

test('An unchanged but stale or no-longer-editable dialog cannot retry a different parent state',async()=>{
 for(const mutate of [r=>{r.parent.flags.character={...r.character,importedAt:'new-import'};},r=>{r.parent.canUserModify=()=>false;}]){
  const r=runtime();foundry.applications.api.DialogV2.wait=async()=>{mutate(r);return {refreshOnly:true};};
  await assert.rejects(playStateDialog(r.app),/inzwischen geändert|Besitzerrecht/);assert.equal(r.parent.writes,0);assert.ok(r.children.every(child=>child.writes===0));
 }
});

test('Inactive and deliberately skipped companions remain untouched during synchronization',async()=>{
 const r=runtime();r.children[0].flags.companion.active=false;const result=await refreshCompanions(r.parent,r.warn,{skipKeys:[r.children[1].flags.companion.key]});assert.deepEqual(result,{updated:1,failed:0,stopped:false});assert.equal(r.children[0].writes,0);assert.equal(r.children[1].writes,0);assert.equal(r.children[2].writes,1);
});
