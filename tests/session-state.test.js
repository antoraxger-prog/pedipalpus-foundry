import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateWorkbench,mergeWorkbench,updateWorkbench,toggleFavorite,moveFavorite,referenceKey,recordRecent} from '../scripts/workbench.js';
import {saveCharacter} from '../scripts/storage.js';
import {normalizeCharacter} from '../scripts/data.js';
import {fixture} from './fixture.js';
const ref=name=>({kind:'attribute',category:'primary',name});
const names=prefs=>(prefs.favorites.hero??[]).map(row=>row.name);
const initial=()=>validateWorkbench({soundVersion:1,figures:{hero:{notes:{old:'Alte Notiz'}}}});

test('Separate windows keep independent favorites, personal notes and display changes',()=>{
 const before=initial(),latest=toggleFavorite(before,'hero',ref('Mut')),next=toggleFavorite(before,'hero',ref('Klugheit'));
 latest.figures.hero.notes.other='Andere Notiz';latest.highContrast=true;next.volume=.1;next.figures.hero.notes.mine='Meine Notiz';
 const result=mergeWorkbench(before,next,latest);
 assert.deepEqual(names(result),['Mut','Klugheit']);assert.deepEqual(result.figures.hero.notes,{old:'Alte Notiz',other:'Andere Notiz',mine:'Meine Notiz'});assert.equal(result.highContrast,true);assert.equal(result.volume,.1);
});

test('Favorite removal and deliberate reordering preserve favorites added in another window',()=>{
 const before=validateWorkbench({favorites:{hero:[ref('Mut'),ref('Klugheit'),ref('Intuition')]}}),latest=toggleFavorite(before,'hero',ref('Charisma'));
 const removed=toggleFavorite(before,'hero',ref('Klugheit'));assert.deepEqual(names(mergeWorkbench(before,removed,latest)),['Mut','Intuition','Charisma']);
 const moved=moveFavorite(before,'hero',ref('Intuition'),'up');assert.deepEqual(names(mergeWorkbench(before,moved,latest)),['Mut','Intuition','Klugheit','Charisma']);
 const remoteRemoval=toggleFavorite(before,'hero',ref('Mut')),localAddition=toggleFavorite(before,'hero',ref('Charisma'));assert.deepEqual(names(mergeWorkbench(before,localAddition,remoteRemoval)),['Klugheit','Intuition','Charisma']);
});

test('First per-figure edits in different windows merge without resetting the other figure settings',()=>{
 const before=validateWorkbench({}),latest=validateWorkbench({figures:{hero:{theme:'ork',rememberTheme:true,notes:{other:'Andere Notiz'}}}}),next=validateWorkbench({figures:{hero:{notes:{mine:'Meine Notiz'}}}});
 const result=mergeWorkbench(before,next,latest).figures.hero;
 assert.equal(result.theme,'ork');assert.equal(result.rememberTheme,true);assert.deepEqual(result.notes,{other:'Andere Notiz',mine:'Meine Notiz'});
});

test('Conflicting weapon-set lists stop before overwriting a list edited elsewhere',()=>{
 const before=initial(),next=structuredClone(before),latest=structuredClone(before);
 next.figures.hero.weaponSets=[{id:'a',name:'Schwert',weapons:['sword']}];latest.figures.hero.weaponSets=[{id:'b',name:'Bogen',weapons:['bow']}];
 assert.throws(()=>mergeWorkbench(before,next,latest),/anderen Fenster/);assert.equal(latest.figures.hero.weaponSets[0].id,'b');
});

test('Recent rolls from another window remain available without duplicate references',()=>{
 const before=initial(),next=recordRecent(before,'hero',ref('Mut')),latest=recordRecent(before,'hero',ref('Klugheit'));
 const result=mergeWorkbench(before,next,latest);assert.deepEqual(result.recent.hero.map(row=>row.name),['Mut','Klugheit']);assert.equal(new Set(result.recent.hero.map(referenceKey)).size,2);
});

test('Simultaneous preference writes are serialized across window queues and a failure does not block later saves',async()=>{
 let stored=initial(),active=0,maxActive=0,fail=true;
 globalThis.game={user:{id:'owner'},world:{id:'world'},settings:{get:(_ns,key)=>key==='workbench'?structuredClone(stored):{},async set(_ns,_key,value){active++;maxActive=Math.max(maxActive,active);await new Promise(resolve=>setImmediate(resolve));active--;if(fail){fail=false;throw new Error('Speichern fehlgeschlagen');}stored=structuredClone(value);}}};
 const before=initial();await assert.rejects(updateWorkbench(before,{...before,volume:.2}),/fehlgeschlagen/);
 await Promise.all([updateWorkbench(before,toggleFavorite(before,'hero',ref('Mut'))),updateWorkbench(before,toggleFavorite(before,'hero',ref('Klugheit')))]);
 assert.equal(maxActive,1);assert.deepEqual(names(stored),['Mut','Klugheit']);
});

test('A character import preserves a portrait changed during the character flag write',async()=>{
 const snapshot=normalizeCharacter(fixture()),flags={character:snapshot},actor={id:'hero',img:'old.png',getFlag:(_ns,key)=>flags[key],canUserModify:()=>true,async setFlag(_ns,key,value){flags[key]=value;this.img='newer.png';},async update(){assert.fail('A stale portrait must not be applied');}};
 globalThis.game={system:{id:'worldbuilding'},world:{id:'world'},user:{id:'owner',isGM:true},actors:{get:()=>actor},scenes:{contents:[]}};
 globalThis.foundry={applications:{apps:{FilePicker:{implementation:{browse:async()=>({dirs:['worlds/world/pedipalpus-portraits'],files:[]}),upload:async()=>({path:'worlds/world/pedipalpus-portraits/upload.png'})}}}}};
 const portrait={file:new File(['picture'],'portrait.png',{type:'image/png'}),extension:'png'};
 await assert.rejects(saveCharacter(snapshot,actor.id,portrait,()=>{},JSON.stringify(snapshot)),/Charakterbild wurde inzwischen geändert/);assert.equal(actor.img,'newer.png');
});
