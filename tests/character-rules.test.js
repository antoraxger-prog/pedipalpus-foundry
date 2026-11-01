import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {combatFixture,retinueFixture,npcFixture} from './fixture.js';
import {normalizeCharacter} from '../scripts/data.js';
import {prepareCharacterRules,conditionState} from '../scripts/character-rules.js';
import {buildCommand} from '../scripts/commands.js';
import {withFocus} from '../scripts/combat.js';
import {withArmorState} from '../scripts/equipment.js';
import {checksForView,renderView} from '../scripts/view.js';
import {checkReference,resolveCheck} from '../scripts/workbench.js';

function modern(){
 const raw=retinueFixture();
 const convert=value=>{
  if(!value||typeof value!=='object')return;
  if(value.ShortName&&Number.isSafeInteger(value.TotalValue)){
   value.BaseValue=value.TotalValue;value.ModValue=0;value.RuleModValue=0;delete value.TotalValue;
  }
  for(const child of Object.values(value))convert(child);
 };
 convert(raw);
 raw.PrimaryAttributes.push({ShortName:'FF',LongName:'Fingerfertigkeit',BaseValue:12,ModValue:1,RuleModValue:1},{ShortName:'CH',LongName:'Charisma',BaseValue:11,ModValue:0});
 raw.SecondaryAttributes.push({ShortName:'RE',LongName:'Reaktionsvermögen',BaseValue:5,ModValue:1});
 raw.DerivedValues=[{ShortName:'LE',TotalValue:31,BaseValue:1,ModValue:2},{ShortName:'GS',TotalValue:8,BaseValue:8,ModValue:2}];
 raw.BodySkills=[{Name:'Bewegen',Value:4,FirstAttribute:raw.PrimaryAttributes.find(a=>a.ShortName==='GE'),SecondAttribute:raw.PrimaryAttributes[0],ThirdAttribute:raw.PrimaryAttributes[0],Subskills:[{Name:'Klettern',BaseValue:3,TotalValue:7}]}];
 raw.SimpleConditions=[];raw.ComplexConditions=[];
 return raw;
}
const find=(data,id)=>data.checks.find(check=>check.id===id);
const snapshot=raw=>({...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)});

test('Current saves reconstruct missing totals without adding saved rule modifiers twice or changing energy maxima',()=>{
 const raw=modern(),before=JSON.stringify(raw),data=normalizeCharacter(raw);
 assert.equal(data.characterRulesVersion,1);
 assert.equal(data.attributes.find(a=>a.short==='FF').value,13);
 assert.equal(find(data,'AcademicSkills:0:0').attributes[0].value,16);
 assert.equal(data.resources[0].max,31);
 assert.equal(JSON.stringify(raw),before);
 assert.equal(normalizeCharacter(combatFixture()).characterRulesVersion,undefined);
 assert.equal(normalizeCharacter(npcFixture()).characterRulesVersion,undefined);
});

test('Temporary attributes and check penalties match the distinct source stages and do not affect companions',()=>{
 const raw=modern();raw.ComplexConditions=[{Name:'Benommen',Level:1},{Name:'Lähmung',Level:1},{Name:'Wut',Level:1},{Name:'Schmerz',Level:1}];raw.SimpleConditions=[{Name:'Reue',IsActive:true}];
 const data=normalizeCharacter(raw);
 assert.equal(data.attributes.find(a=>a.short==='CH').value,6);
 assert.equal(data.attributes.find(a=>a.short==='GE').value,7);
 assert.equal(find(data,'AcademicSkills:0:0').attributes[0].value,13);
 assert.equal(find(data,'AcademicSkills:0:0').value,6);
 assert.equal(find(data,'BodySkills:0:0').value,3);
 assert.equal(find(data,'combat:MeleeWeapons:0:attack').combat.baseValue,-1);
 assert.equal(find(data,'combat:MeleeWeapons:0:parry').combat.baseValue,-3);
 assert.equal(find(data,'combat:RangedWeapons:0:ranged').combat.baseValue,0);
 assert.equal(find(data,'animals:0:0:attack').value,6);
 assert.equal(find(data,'demons:0:attribute:GE').value,16);
 const changed=withFocus(data,2);
 for(const check of changed.checks.filter(c=>!c.reason&&!c.needsAttributes))assert.doesNotThrow(()=>buildCommand(check),check.id);
 assert.equal(find(changed,'combat:MeleeWeapons:0:attack').value-find(data,'combat:MeleeWeapons:0:attack').value,6);
});

test('Suppression uses the stronger automatic or manual reduction, not their sum, and supports legacy numeric enums',()=>{
 const raw=modern();raw.Advantages=[{Name:'Eisern'},{Name:'Ausdauernd'}];
 raw.ComplexConditions=[{Name:'Schmerz',Level:3,Suppression:2},{Name:'Überanstrengung',Level:2,Suppression:'TwoLevels'},{Name:'Wut',Level:3,Suppression:'All'}];
 raw.SimpleConditions=[{Name:'Reue',IsActive:true,IsSuppressed:true}];
 const state=conditionState(raw),data=normalizeCharacter(raw);
 assert.equal(state.level('Schmerz'),2);assert.equal(state.level('Überanstrengung'),0);assert.equal(state.level('Wut'),0);
 assert.equal(data.attributes[0].value,15);assert.equal(find(data,'secondary:1').value,2);
 assert.equal(find(data,'AcademicSkills:0:0').value,4);
 raw.ComplexConditions[0].Suppression=3;assert.equal(conditionState(raw).pain,1);
});

test('Reaction exhausts separately from permanent bases and Theoretiker rounds halves away from zero',()=>{
 const raw=modern();raw.ComplexConditions=[{Name:'Überanstrengung',Level:2}];raw.Disadvantages=[{Name:'Theoretiker'},{Name:'Schlechte Gelenke'}];
 const data=normalizeCharacter(raw);
 assert.equal(find(data,'secondary:1').value,2);
 assert.equal(find(data,'BodySkills:0:0').value,4);
 assert.equal(find(data,'AcademicSkills:0:0').value,8);
 assert.equal(find(data,'combat:MeleeWeapons:0:parry').rulePenalty,2);
 assert.equal(prepareCharacterRules(raw).Gs,'4');
 raw.BodySkills[0].Subskills[0].TotalValue=-7;assert.equal(find(normalizeCharacter(raw),'BodySkills:0:0').value,-4);
});

test('Incapacitation stays visible, disables its normal and blind buttons, blocks commands and leaves companions available',()=>{
 const raw=modern();raw.ComplexConditions=[{Name:'Schmerz',Level:3}];const data=normalizeCharacter(raw);
 const blocked=find(data,'combat:MeleeWeapons:0:attack');
 assert.equal(blocked.ruleBlocked,true);assert.throws(()=>buildCommand(blocked),/Schmerz III/);
 assert.ok(checksForView(data,'battle').includes(blocked));
 assert.doesNotThrow(()=>buildCommand(find(data,'animals:0:0:attack')));
 const html=renderView({actor:{isOwner:true},character:data,status:{ready:true},mode:'battle'});
 assert.match(html,/data-check="combat:MeleeWeapons:0:attack"[^>]*disabled/);
 assert.match(html,/Zustände: Schmerz 3/);
 raw.ComplexConditions=[{Name:'Benommen',Level:3}];
 assert.equal(find(normalizeCharacter(raw),'combat:MeleeWeapons:0:parry').ruleBlocked,undefined);
 raw.ComplexConditions=[{Name:'Lähmung',Level:2}];
 assert.equal(find(normalizeCharacter(raw),'primary:0').ruleBlocked,true);
});

test('Berserk ignores pain and blocks defensive checks; suppressed berserk restores pain',()=>{
 const raw=modern();raw.SimpleConditions=[{Name:'Blutrausch',IsActive:true}];raw.ComplexConditions=[{Name:'Schmerz',Level:3}];
 const data=normalizeCharacter(raw);
 assert.equal(find(data,'combat:MeleeWeapons:0:attack').ruleBlocked,undefined);
 assert.equal(find(data,'combat:MeleeWeapons:0:attack').rulePenalty,undefined);
 assert.match(find(data,'combat:MeleeWeapons:0:parry').reason,/Blutrausch/);
 raw.SimpleConditions[0].IsSuppressed=true;assert.match(find(normalizeCharacter(raw),'combat:MeleeWeapons:0:attack').reason,/Schmerz/);
});

test('Only the selected eligible off hand boosts a one-handed main parry, using its own training table',()=>{
 const raw=modern();raw.MeleeWeapons[0].Handedness='Einhändig';raw.ActiveOffHandWeaponId='shield';
 Object.assign(raw.ParryWeapons[0],{InventoryItemId:'shield',Handedness:'Einhändig',ParryBonus:[-2,0,3],DefenseBonus:999,DefenseTrainingSkill:'Schildkampf'});
 raw.CombatSpecialSkills=[{Name:'Schildkampf II',Level:0}];
 const data=normalizeCharacter(raw);
 assert.equal(find(data,'combat:MeleeWeapons:0:parry').combat.weaponModifier,4);
 assert.equal(find(data,'combat:MeleeWeapons:0:attack').combat.weaponModifier,0);
 assert.equal(find(data,'combat:ParryWeapons:0:parry').combat.weaponModifier,3);
 for(const patch of [{Handedness:'Zweihändig'},{OnPerson:false},{CarrierAnimalId:'skeleton'},{Quantity:0},{Name:'Unbewaffnet'}]){
  const next=structuredClone(raw);Object.assign(next.MeleeWeapons[0],patch);assert.equal(find(normalizeCharacter(next),'combat:MeleeWeapons:0:parry').combat.weaponModifier,1);
 }
 raw.ParryWeapons[0].OnPerson=false;assert.equal(find(normalizeCharacter(raw),'combat:MeleeWeapons:0:parry').combat.weaponModifier,1);
});

test('Armor changes retain the current armor familiarity discount without reducing overload',()=>{
 const raw=modern();raw.DerivedValues=Array.from({length:9},(_,i)=>({TotalValue:i===8?10:0}));
 raw.Armors=[{Name:'Leder',BaseMobilityPenalty:2,Protection:2,Weight:0,IsEquiped:true,OnPerson:true}];
 raw.GeneralItems=[{Name:'Last',Weight:11,Quantity:1}];raw.CombatSpecialSkills=[{Name:'Rüstungsgewöhnung I'}];
 const data=withArmorState(snapshot(raw),'Armors:0','equipped',true);
 assert.equal(JSON.parse(data.sourceJSON).Be,2);
 assert.equal(withArmorState(data,'Armors:0','equipped',false).combat.stats.find(x=>x.name==='BE').value,1);
 assert.equal(normalizeCharacter(JSON.parse(data.sourceJSON)).checks.find(c=>c.id==='AcademicSkills:0:0').value,8);
});

test('Sorting and state changes preserve semantic favorites and macro references',()=>{
 const raw=modern(),data=normalizeCharacter(raw),ref=checkReference(find(data,'AcademicSkills:0:0'));
 raw.AcademicSkills.unshift({...structuredClone(raw.AcademicSkills[0]),Name:'Anderes',Subskills:[{Name:'Andere Probe',TotalValue:2}]});
 raw.ComplexConditions=[{Name:'Schmerz',Level:1}];
 const current=resolveCheck(normalizeCharacter(raw),ref);
 assert.equal(current.name,'Geographie');assert.equal(current.value,6);assert.equal(current.id,'AcademicSkills:1:0');
});

test('Person companions retain divine abilities, own evasion and perception; assigned weapons never roll with the owner stats',()=>{
 const raw=modern();raw.Persons=[{...raw.Demons[0],Name:'Geweihte Wache',InventoryId:'person-1',Attacks:[{Name:'Speer',AttackValue:13,ParryValue:9}],DerivedValues:[{Key:'AW',BaseValue:8,RuleModifier:1,Modifier:0,Constant:0,IsMultiplier:false},{Key:'WA',BaseValue:2.5,RuleModifier:0,Modifier:0,Constant:0,IsMultiplier:false}],DivineAbilities:[{Name:'Segen',Value:8,FirstAttribute:'MU',SecondAttribute:'IN',ThirdAttribute:'CH'}]}];
 raw.MeleeWeapons[0].CarrierAnimalId='person-1';
 const data=normalizeCharacter(raw),before=JSON.stringify(raw);
 assert.equal(find(data,'combat:MeleeWeapons:0:attack'),undefined);
 assert.equal(find(data,'persons:0:0:attack').value,13);
 assert.match(buildCommand(find(data,'persons:0:dodge:parry')),/Ausweichen\|Ausweichen\|9\|0\|0\|0\|0$/);
 assert.equal(find(data,'persons:0:derived:WA').value,3);
 assert.equal(find(data,'persons:0:divine:0').value,8);
 assert.equal(find(withFocus(data,3),'persons:0:0:attack').value,13);
 assert.equal(JSON.stringify(raw),before);
});

test('Current upstream sample saves import with all eight attributes and valid commands',{skip:!process.env.PEDIPALPUS_CURRENT_SAMPLES},()=>{
 const folder=process.env.PEDIPALPUS_CURRENT_SAMPLES;
 const files=fs.readdirSync(folder).filter(name=>/^T\d+ .*\.json$/.test(name));assert.equal(files.length,10);
 for(const file of files){
  const raw=JSON.parse(fs.readFileSync(path.join(folder,file),'utf8')),data=normalizeCharacter(raw);
  assert.equal(data.attributes.length,8,file);assert.equal(data.characterRulesVersion,1,file);
  for(const check of data.checks.filter(row=>!row.reason&&!row.needsAttributes))assert.doesNotThrow(()=>buildCommand(check),`${file}: ${check.id}`);
  for(const attr of data.attributes){const saved=raw.PrimaryAttributes.find(row=>row.ShortName===attr.short);assert.equal(attr.value,saved.BaseValue+saved.ModValue,file);}
 }
});
