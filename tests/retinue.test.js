import {test} from 'node:test';
import assert from 'node:assert/strict';
import {retinueFixture} from './fixture.js';
import {normalizeCharacter,validSnapshot} from '../scripts/data.js';
import {buildCommand} from '../scripts/commands.js';
import {withFocus} from '../scripts/combat.js';
import {getCharacter} from '../scripts/storage.js';
import {readCompanions,isCompanionCheck,withCompanionAttributes,retainCompanionChoices} from '../scripts/retinue.js';
import {companionKey,companionSnapshot,refreshCompanions} from '../scripts/companions.js';
import {checksForView,renderView,mastery} from '../scripts/view.js';
import {checkReference,referenceKey,resolveCheck} from '../scripts/workbench.js';

const snapshot=raw=>({...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)});
const find=(character,id)=>character.checks.find(check=>check.id===id);

test('All three retinue collections use their own attributes, resistances and final melee/ranged values',()=>{
 const character=snapshot(retinueFixture());assert.deepEqual(readCompanions(character).map(member=>member._group),['animals','demons','undead']);
 for(const group of ['animals','demons','undead']){
  assert.equal(buildCommand(find(character,`${group}:0:attribute:KL`)),`/attributecheck ${group==='animals'?'Skelett':group==='demons'?'Testdämon':'Wache'} – Klugheit 12`);
  assert.deepEqual(find(character,`${group}:0:resistance:MentalMagicResistance`).attributes.map(attr=>attr.value),[11,12,13]);
  assert.deepEqual(find(character,`${group}:0:resistance:PhysicalMagicResistance`).attributes.map(attr=>attr.value),[16,17,18]);
 }
 assert.equal(buildCommand(find(character,'animals:0:0:attack')),'/AT Skelett – Hieb|Hieb|6|0|0|0|0');
 assert.equal(buildCommand(find(character,'demons:0:0:parry')),'/PA Testdämon – Klaue|Klaue|12|0|0|0|0');
 assert.equal(buildCommand(find(character,'demons:0:1:ranged')),'/FK Testdämon – Feuer|Feuer|19|0|0|0');
 assert.equal(find(character,'demons:0:1:parry'),undefined);
 assert.equal(buildCommand(find(character,'undead:0:0:ranged')),'/FK Wache – Bogen|Bogen|8|0|0|0');
 assert.ok(character.checks.filter(isCompanionCheck).filter(c=>!c.needsAttributes).every(c=>Boolean(buildCommand(c))));
});

test('Focus and armor penalties never change companion probes',()=>{
 const character=snapshot(retinueFixture()),next=withFocus(character,4);
 assert.deepEqual(next.checks.filter(isCompanionCheck),character.checks.filter(isCompanionCheck));
 assert.notEqual(find(next,'combat:MeleeWeapons:0:attack').value,find(character,'combat:MeleeWeapons:0:attack').value);
});

test('Pending abilities stay visible only in combat and accept repeated own attributes without inventing values',()=>{
 const raw=retinueFixture(),character=snapshot(raw),pending=find(character,'demons:0:mundane:0');
 assert.equal(pending.needsAttributes,true);assert.throws(()=>buildCommand(pending),/vollständig/);
 assert.equal(checksForView(character).some(isCompanionCheck),false);assert.ok(checksForView(character,'battle').includes(pending));
 const chosen=withCompanionAttributes(character,pending.id,['MU','MU','KO']);
 assert.equal(buildCommand(find(chosen,pending.id)),'/skillcheck Testdämon – Überreden | Mut 11 | Mut 11 | Konstitution 17 | 12');
 assert.equal(JSON.parse(chosen.sourceJSON).Demons[0].MundaneAbilities[0].ThirdAttribute,'KO');
 assert.equal(raw.Demons[0].MundaneAbilities[0].ThirdAttribute,undefined);assert.equal(pending.needsAttributes,true);
 assert.throws(()=>withCompanionAttributes(character,pending.id,['MU','KL','missing']),/vorhandene Attribute/);
 delete raw.Demons[0].MU;assert.equal(find(snapshot(raw),'demons:0:attribute:MU'),undefined);
 raw.Demons[0].KL=0;assert.match(buildCommand(find(snapshot(raw),'demons:0:attribute:KL')),/ 0$/);
});

test('Abilities remember choices across reordering but respect new source choices and reject ambiguity',()=>{
 const raw=retinueFixture(),previous=withCompanionAttributes(snapshot(raw),'demons:0:mundane:0',['MU','MU','KO']);
 raw.Demons.unshift({...raw.Demons[0],Name:'Anderer',InventoryId:'demon-2',MundaneAbilities:[]});
 let next=retainCompanionChoices(previous,snapshot(raw));assert.deepEqual(find(next,'demons:1:mundane:0').companionAbility.keys,['MU','MU','KO']);
 Object.assign(raw.Demons[1].MundaneAbilities[0],{FirstAttribute:'KL',SecondAttribute:'IN',ThirdAttribute:'CH'});
 next=retainCompanionChoices(previous,snapshot(raw));assert.deepEqual(find(next,'demons:1:mundane:0').companionAbility.keys,['KL','IN','CH']);
 raw.Demons[1].MundaneAbilities=[{Name:'Überreden',Value:12},{Name:'Überreden',Value:12}];
 next=retainCompanionChoices(previous,snapshot(raw));assert.equal(find(next,'demons:1:mundane:0').needsAttributes,true);
});

test('Legacy animal references remain byte-identical and new companion IDs disambiguate equal names',()=>{
 const raw=retinueFixture(),character=snapshot(raw),old=find(character,'animals:0:0:attack');
 assert.equal(referenceKey(checkReference(old)),JSON.stringify(['combat','animals','skelett – hieb · angriff','attack','skelett – hieb','skelett']));
 const reference=checkReference(find(character,'demons:0:0:attack'));
 raw.Demons.unshift({...raw.Demons[0],InventoryId:'demon-2'});
 assert.equal(resolveCheck(snapshot(raw),reference).id,'demons:1:0:attack');
 assert.equal(companionKey(character,0),'id:old-skeleton');assert.equal(companionKey(character,1),'id:demon-1');
 raw.Undead[0].InventoryId='old-skeleton';assert.throws(()=>companionKey(snapshot(raw),0),/eindeutig/);
});

test('Old stored snapshots upgrade only companion data without writing or changing focus and other values',()=>{
 const current=snapshot(retinueFixture()),old=structuredClone(current);delete old.retinueSchemaVersion;delete old.retinue;
 old.checks=old.checks.filter(check=>!isCompanionCheck(check)||check.id==='animals:0:0:attack');
 old.profile.name='Foundry-Name';old.combat.offDefOffset=2;
 const before=structuredClone(old),actor={getFlag:()=>old,setFlag:()=>assert.fail('Read-only migration wrote data')},upgraded=getCharacter(actor);
 assert.equal(validSnapshot(upgraded),true);assert.equal(upgraded.retinueSchemaVersion,1);assert.equal(upgraded.retinue.length,3);
 assert.equal(upgraded.profile.name,'Foundry-Name');assert.equal(upgraded.combat.offDefOffset,2);
 assert.deepEqual(upgraded.checks.filter(c=>!isCompanionCheck(c)),old.checks.filter(c=>!isCompanionCheck(c)));assert.deepEqual(old,before);
 delete old.sourceJSON;assert.equal(getCharacter(actor),old);
});

test('Standalone companion snapshots contain all their own checks but no owner character source or focus',()=>{
 const character=snapshot(retinueFixture());
 for(const [index,group] of ['animals','demons','undead'].entries()){
  const child=companionSnapshot(character,index);assert.equal(validSnapshot(child),true);assert.equal(child.profile.companionGroup,group);assert.equal(child.sourceJSON,undefined);
  assert.ok(child.checks.length>=11);assert.ok(child.checks.every(check=>check.id.startsWith(`${group}:0:`)));assert.equal(child.retinue.length,1);
  assert.equal(child.attributes.find(attr=>attr.short==='KL').value,12);assert.equal(child.combat.offDefOffset,undefined);
 }
 const child=companionSnapshot(character,1),chosen=withCompanionAttributes(child,'demons:0:mundane:0',['MU','MU','KO']);
 assert.match(buildCommand(find(chosen,'demons:0:mundane:0')),/Mut 11 \| Mut 11 \| Konstitution 17/);
});

test('Reimport refreshes all linked creature kinds while retaining portraits and chosen attributes',async()=>{
 const raw=retinueFixture();let character=snapshot(raw);
 const children=readCompanions(character).map((member,index)=>({id:`child-${index}`,img:'kept.png',flags:{companion:{sourceActorId:'parent',key:companionKey(character,index)},character:companionSnapshot(character,index)},getFlag(_ns,key){return this.flags[key];},canUserModify:()=>true,async setFlag(_ns,key,value){this.flags[key]=value;}}));
 children[1].flags.character=withCompanionAttributes(children[1].flags.character,'demons:0:mundane:0',['MU','MU','KO']);
 globalThis.game={user:{id:'owner'},actors:{contents:children}};const parent={id:'parent',getFlag:(_ns,key)=>key==='character'?character:undefined};
 raw.Demons[0].Attacks[0].AttackValue=21;raw.Undead[0].CurrentLe=9;character=snapshot(raw);
 await refreshCompanions(parent);assert.equal(find(children[1].flags.character,'demons:0:0:attack').value,21);assert.equal(children[2].flags.character.resources[0].value,9);
 assert.deepEqual(find(children[1].flags.character,'demons:0:mundane:0').companionAbility.keys,['MU','MU','KO']);assert.ok(children.every(child=>child.img==='kept.png'));
 raw.Demons=[];character=snapshot(raw);await refreshCompanions(parent);assert.equal(children[1].flags.character.checks.length,0);assert.ok(children[0].flags.character.checks.length);
});

test('Cards show all kinds even without attacks and resistance values do not receive talent ranks',()=>{
 const raw=retinueFixture();raw.Undead[0].Attacks=[];const character=snapshot(raw);
 const html=renderView({actor:{isOwner:true},character,status:{ready:true,combatReady:true},mode:'battle'});
 for(const kind of ['animals','demons','undead'])assert.match(html,new RegExp(`data-inventory="${kind}"`));
 assert.match(html,/Testdomäne/);assert.match(html,/AE 22 \/ 30/);assert.match(html,/Wache/);
 assert.equal(mastery(find(character,'demons:0:resistance:MentalMagicResistance')).scale,'other');
});
