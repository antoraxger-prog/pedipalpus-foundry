import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCharacter,RETINUE_FORMAT} from '../scripts/data.js';
import {stateResources,withPlayState,retainPlayState} from '../scripts/play-state.js';
import {retinueFixture,npcFixture} from './fixture.js';
import {damageFormula} from '../scripts/check-details.js';
import {buildCommand} from '../scripts/commands.js';

test('A standalone consecrated companion exposes and updates its own karma without changing the imported source',()=>{
 const member={...retinueFixture().Animals[0],CurrentKarmaEnergy:7,KarmaEnergy:12,CurrentAstralEnergy:0,AstralEnergy:0};
 const raw={Format:RETINUE_FORMAT,Version:1,Name:'Geweihter Begleiter',Persons:[member]};
 const before={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};
 assert.deepEqual(before.resources.map(row=>row.name),['LE','KE']);
 assert.deepEqual(stateResources(before).map(entry=>entry.resources.map(row=>[row.name,row.value,row.max])),[[['LE',14,20],['KE',7,12]]]);
 const changed=withPlayState(before,{version:1,resources:{root:{KE:5}}});
 assert.equal(changed.resources.find(row=>row.name==='KE').value,5);
 assert.equal(changed.retinue[0].CurrentKarmaEnergy,5);
 assert.equal(changed.sourceJSON,before.sourceJSON);
 raw.Persons[0].CurrentKarmaEnergy=9;
 const fresh={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};
 assert.equal(retainPlayState(changed,fresh).resources.find(row=>row.name==='KE').value,5);
 assert.equal(retainPlayState(changed,fresh,{resources:false}).resources.find(row=>row.name==='KE').value,9);
 assert.equal(withPlayState(changed,{version:1}).resources.find(row=>row.name==='KE').value,7);
});

test('NPC weapon damage uses its own strength threshold, Finesse and rounding without trusting cached damage',()=>{
 const raw=npcFixture(),weapon=raw.Npc.Weapons[0];
 Object.assign(weapon,{Damage:'1W6+4',TpKk:'14/2',EffectiveDamage:'100W100',Notes:''});
 raw.Npc.Attributes.find(row=>row.Key==='KK').BaseValue=18;
 const original=JSON.stringify(raw),damage=()=>normalizeCharacter(raw).checks.find(row=>row.id==='combat:MeleeWeapons:0:attack').damage;
 assert.equal(damage(),'1W6+6');assert.equal(JSON.stringify(raw),original);
 raw.Npc.Attributes.find(row=>row.Key==='GE').BaseValue=23;weapon.Notes='Finesse';
 assert.equal(damage(),'1W6+8');
 weapon.Damage='1W6-4';assert.equal(damage(),'1W6');
 weapon.Damage='2W6 + 1W4';assert.equal(damage(),'2W6 + 1W4 + 4');assert.equal(damageFormula(damage()),'2d6+1d4+4');
 weapon.TpKk='14/0';assert.equal(damage(),'2W6 + 1W4');
 Object.assign(raw.Npc.Weapons[1],{Damage:'1W6+2',TpKk:'1/1',Notes:'Finesse'});
 assert.equal(normalizeCharacter(raw).checks.find(row=>row.id==='combat:RangedWeapons:0:ranged').damage,'1W6+2');
});

test('NPC companions keep their stored reaction, damage, reach and ability notes through normalization',()=>{
 const raw=npcFixture(),member=raw.Npc.Retinue[0];
 Object.assign(member,{Reaction:5,Armor:3,Speed:7.5,BindingLoad:2,ServiceVolume:4,SummoningDifficulty:-2,AstralSense:6,CarryCapacity:12.5,Rules:'Eigene Regel',Notes:'Eigener Hinweis'});
 Object.assign(member.Attacks[0],{Damage:'2W6+3',Reach:'Kurz',AttackTicks:6,ParryTicks:3,ReloadTicks:0,Notes:'Angriffshinweis'});
 member.Abilities[0].Notes='Fähigkeitshinweis';
 const data=normalizeCharacter(raw),attack=data.checks.find(row=>row.id==='animals:0:0:attack'),reaction=data.checks.find(row=>row.id==='animals:0:resistance:Reaction');
 assert.equal(attack.damage,'2W6+3');assert.equal(damageFormula(attack.damage),'2d6+3');assert.equal(attack.ranges,'Kurz');
 assert.deepEqual(attack.info,[{label:'Hinweise',text:'Angriffshinweis'}]);
 assert.equal(buildCommand(reaction),'/skillcheck Begleiter Tier – Reaktionsvermögen | Mut 8 | Intuition 8 | Gewandtheit 8 | 5');
 assert.deepEqual(data.checks.find(row=>row.id==='animals:0:mundane:0').info,[{label:'Hinweise',text:'Fähigkeitshinweis'}]);
 const mapped=data.retinue[0];for(const field of ['Armor','Speed','BindingLoad','ServiceVolume','SummoningDifficulty','AstralSense','CarryCapacity','Rules','Notes'])assert.equal(mapped[field],member[field]);
});
