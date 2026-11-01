import {test} from 'node:test';
import assert from 'node:assert/strict';
import {combatFixture} from './fixture.js';
import {normalizeCharacter} from '../scripts/data.js';
import {weaponSetDialog,weaponChoices,weaponIdentity} from '../scripts/play-tools.js';
import {validateWorkbench} from '../scripts/workbench.js';
import {renderView} from '../scripts/view.js';
function runtime(){
 const raw=combatFixture(),snapshot=data=>({...normalizeCharacter(data),sourceJSON:JSON.stringify(data)});let data=snapshot(raw),saved=0,answer=()=>false;const actors=[];
 const actor={id:'hero',isOwner:true,getFlag:()=>data,canUserModify:()=>true};actors.push(actor);globalThis.game={user:{id:'owner'},actors:{contents:actors,get:id=>actors.find(row=>row.id===id)}};
 globalThis.foundry={utils:{randomID:()=> 'new-set'},applications:{api:{DialogV2:{wait:async config=>answer(config)}}}};
 const app={actor,actorId:actor.id,preferences:validateWorkbench({}),dialogClasses:[],async persist(value){saved++;this.preferences=validateWorkbench(value);},async render(){}};
 return {raw,actor,actors,app,setData:value=>{data=snapshot(value);},answer:fn=>{answer=fn;},saved:()=>saved,key:weaponIdentity(data.checks.find(row=>row.id==='combat:MeleeWeapons:0:attack'))};
}
const draft=key=>({remove:[],name:'Duell',weapons:[key],offHand:'unchanged'});

test('A weapon removed during a set dialog cannot be saved as a new stale selection',async()=>{
 const r=runtime();r.answer(()=>{r.raw.MeleeWeapons=[];r.setData(r.raw);return draft(r.key);});await assert.rejects(weaponSetDialog(r.app),/entfernt oder mehrdeutig/);assert.equal(r.saved(),0);
});

test('Weapon reordering keeps a still unique semantic selection valid',async()=>{
 const r=runtime();r.answer(()=>{r.raw.MeleeWeapons.unshift({...r.raw.MeleeWeapons[0],Name:'Anderes Schwert'});r.setData(r.raw);return draft(r.key);});await weaponSetDialog(r.app);assert.deepEqual(r.app.preferences.figures.hero.weaponSets[0].weapons,[r.key]);
});

test('A deleted or switched character cannot receive a set under another figure key',async()=>{
 for(const mutate of [r=>{r.actors.length=0;},r=>{r.app.actorId='different';}]){const r=runtime();r.answer(()=>{mutate(r);return draft(r.key);});await assert.rejects(weaponSetDialog(r.app),/gewechselt oder entfernt/);assert.equal(r.saved(),0);}
});

test('Old weapon sets remain removable after the character loses all weapons',async()=>{
 const r=runtime();r.app.preferences=validateWorkbench({figures:{hero:{weaponSets:[{id:'old',name:'Alt',weapons:[r.key]}],activeSet:'old'}}});r.raw.MeleeWeapons=[];r.raw.ParryWeapons=[];r.raw.RangedWeapons=[];r.setData(r.raw);
 const html=renderView({actor:r.actor,character:r.actor.getFlag(),status:{ready:true},mode:'battle',preferences:r.app.preferences});assert.match(html,/data-action="weapons"/);
 r.answer(config=>{assert.match(config.content,/Alt entfernen/);return {remove:[0],name:'',weapons:[],offHand:'unchanged'};});await weaponSetDialog(r.app);assert.deepEqual(r.app.preferences.figures.hero.weaponSets,[]);assert.equal(r.app.preferences.figures.hero.activeSet,'');
});

test('A duplicated weapon appearing during a dialog is rejected rather than guessed',async()=>{
 const r=runtime();r.answer(()=>{r.raw.MeleeWeapons.push({...r.raw.MeleeWeapons[0]});r.setData(r.raw);return draft(r.key);});await assert.rejects(weaponSetDialog(r.app),/entfernt oder mehrdeutig/);assert.equal(r.saved(),0);assert.deepEqual(weaponChoices(null),[]);
});
