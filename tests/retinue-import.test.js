import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCharacter,parseCharacter,validSnapshot,RETINUE_FORMAT} from '../scripts/data.js';
import {retinueFixture} from './fixture.js';
import {readCompanions,withCompanionAttributes,retainCompanionChoices} from '../scripts/retinue.js';
import {buildCommand} from '../scripts/commands.js';
import {companionSnapshot} from '../scripts/companions.js';
import {checksForView,renderCompanionRules,mastery} from '../scripts/view.js';
const example=()=>({Format:RETINUE_FORMAT,Version:1,Name:'Eigene Gefolgsbibliothek',Undead:[{...retinueFixture().Undead[0],Reaction:9,NaturalArmor:3,BindingLoad:6,Speed:5,Description:'Ein eigener Untoter.',SpecialProperties:'<script>unsafe()</script>'}]});
const snapshot=raw=>({...parseCharacter(JSON.stringify(raw)),sourceJSON:JSON.stringify(raw)});
test('Standalone retinue imports contain final creature stats and no fabricated main-character probes',()=>{
 const raw=example(),character=snapshot(raw);assert.equal(validSnapshot(character),true);assert.equal(character.sourceFormat,RETINUE_FORMAT);assert.equal(character.sourceVersion,1);assert.equal(character.profile.retinueOnly,true);assert.equal(character.profile.companionGroup,'undead');
 assert.equal(character.checks.every(row=>row.id.startsWith('undead:')),true);assert.equal(checksForView(character).length,0);assert.ok(checksForView(character,'battle').length>10);assert.equal(character.attributes.length,8);assert.deepEqual(character.resources[0],{name:'LE',value:14,max:20});
 assert.equal(buildCommand(character.checks.find(row=>row.id==='undead:0:resistance:Reaction')),'/skillcheck Wache – Reaktionsvermögen | Mut 11 | Intuition 13 | Gewandtheit 16 | 9');
 assert.equal(readCompanions(character)[0].BindingLoad,6);
});
test('Retinue libraries validate identities, arrays, attributes and format instead of impersonating PC or NPC files',()=>{
 for(const mutate of [r=>r.Version=2,r=>r.PrimaryAttributes=[],r=>r.Npc={},r=>r.Undead=null,r=>r.Undead=[],r=>r.Undead.push({...r.Undead[0]}),r=>delete r.Undead[0].InventoryId,r=>delete r.Undead[0].KO,r=>r.Undead[0].MU=Infinity,r=>r.Undead[0].Attacks='bad',r=>r.Undead[0].Name='bad|name']){const raw=example();mutate(raw);assert.throws(()=>normalizeCharacter(raw),/Gefolgsdatei/);}
 const raw=example();raw.AcademicSkills=retinueFixture().AcademicSkills;assert.ok(normalizeCharacter(raw).checks.every(row=>row.id.startsWith('undead:')));
});
test('Multi-creature library keeps independent stable identities and final attack values',()=>{
 const raw=example();raw.Undead.push({...raw.Undead[0],Name:'Zweite Wache',InventoryId:'second'});const character=snapshot(raw);assert.equal(character.profile.companionGroup,undefined);assert.equal(character.attributes.length,0);assert.equal(readCompanions(character).length,2);
 const single=companionSnapshot(character,1);assert.equal(single.profile.name,'Zweite Wache');assert.ok(single.checks.every(row=>row.companionIndex===0));assert.equal(single.retinue[0].BindingLoad,6);assert.equal(single.retinue[0].Reaction,9);
});
test('An additional attack without a listed parry never invents a parry roll',()=>{
 const raw=example();raw.Undead[0].Attacks=[{Name:'Biss',AttackValue:16,AttackOnly:true,DamageExpression:'1W6+3'}];const character=snapshot(raw),attack=character.checks.find(row=>row.kind==='combat');assert.equal(buildCommand(attack),'/AT Wache – Biss|Biss|16|0|0|0|0');assert.equal(character.checks.filter(row=>row.kind==='combat').length,1);
});
test('Flexible ability attributes remain selectable and remembered through standalone reimports',()=>{
 const raw=example();raw.Undead[0].MundaneAbilities=[{Name:'Recherche',Value:16}];const character=snapshot(raw),check=character.checks.find(row=>row.companionAbility);assert.equal(check.needsAttributes,true);assert.equal(mastery(check).label,'Meister');const chosen=withCompanionAttributes(character,check.id,['KL','KL','IN']);assert.match(buildCommand(chosen.checks.find(row=>row.id===check.id)),/Klugheit 12 \| Klugheit 12 \| Intuition 13 \| 16$/);const next=retainCompanionChoices(chosen,snapshot(raw));assert.deepEqual(next.checks.find(row=>row.id===check.id).companionAbility.keys,['KL','KL','IN']);assert.equal(JSON.parse(chosen.sourceJSON).Format,RETINUE_FORMAT);
});
test('Creature rules render source values and damage safely as collapsible text',()=>{
 const member=example().Undead[0];member.Attacks[0].DamageExpression='1W6+4';const html=renderCompanionRules(member);assert.match(html,/Spielwerte und Regeln/);assert.match(html,/<strong>Bindungslast<\/strong> 6/);assert.match(html,/1W6\+4/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
});
import {saveCharacter} from '../scripts/storage.js';
test('Standalone retinue files and existing PCs cannot replace one another',async()=>{
 const previousGame=globalThis.game,pc=normalizeCharacter(retinueFixture()),file={Format:'Pedipalpus.Gefolge',Version:1,Name:'Wache',Undead:retinueFixture().Undead},retinue=normalizeCharacter(file);
 let current=pc;const actor={canUserModify:()=>true,getFlag:(_ns,key)=>key==='character'?current:undefined,setFlag:()=>assert.fail('Conflicting format wrote data')};
 globalThis.game={system:{id:'worldbuilding'},user:{id:'owner'},actors:{get:()=>actor}};
 try{await assert.rejects(()=>saveCharacter(retinue,'existing'),/Import/);current=retinue;await assert.rejects(()=>saveCharacter(pc,'existing'),/Import/);}finally{globalThis.game=previousGame;}
});
