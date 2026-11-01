import {test} from 'node:test';
import assert from 'node:assert/strict';
import {combatFixture,npcFixture} from './fixture.js';
import {normalizeCharacter} from '../scripts/data.js';
import {armorItems,armorFingerprint,withArmorState} from '../scripts/equipment.js';
import {saveArmorState} from '../scripts/storage.js';
import {withFocus} from '../scripts/combat.js';
import {withPlayState} from '../scripts/play-state.js';
import {buildCommand} from '../scripts/commands.js';
const snapshot=raw=>({...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)});
function armorFixture(){const raw=combatFixture();raw.DerivedValues=Array.from({length:9},(_,i)=>({ShortName:i===0?'LE':i===8?'TK':'',TotalValue:i===0?31:i===8?50:0}));raw.Armors=[{InventoryId:'armor-a',Name:'Kette',Protection:5,BaseMobilityPenalty:2,MobilityPenalty:2,Weight:8,OnPerson:true,IsEquiped:true},{InventoryId:'armor-b',Name:'Helm',Protection:2,BaseMobilityPenalty:1,MobilityPenalty:1,Weight:2,OnPerson:true,IsEquiped:false}];return raw;}

test('An old armor checkbox cannot edit a different armor after the source list is reordered',async()=>{
 const raw=armorFixture(),before=snapshot(raw),expected=armorFingerprint(armorItems(before)[0]);raw.Armors.reverse();let current=snapshot(raw),writes=0;
 const actor={isOwner:true,canUserModify:()=>true,getFlag:()=>current,async setFlag(_ns,_key,value){writes++;current=value;}};globalThis.game={user:{id:'owner'}};
 await assert.rejects(saveArmorState(actor,'Armors:0','equipped',false,expected),/neu sortiert/);assert.equal(writes,0);assert.equal(current.sourceJSON,JSON.stringify(raw));
});

test('Otherwise identical armors with different inventory identities are not silently exchanged',()=>{
 const raw=armorFixture();raw.Armors[1]={...raw.Armors[0],InventoryId:'armor-b'};const before=snapshot(raw),expected=armorFingerprint(armorItems(before)[0]);raw.Armors.reverse();assert.throws(()=>withArmorState(snapshot(raw),'Armors:0','equipped',false,expected),/inzwischen geändert/);
});

test('An unchanged armor can be edited after energy and focus changes without restoring the old play state',()=>{
 const before=snapshot(armorFixture()),expected=armorFingerprint(armorItems(before)[0]),live=withFocus(withPlayState(before,{version:1,resources:{root:{LE:8}}}),2);
 const changed=withArmorState(live,'Armors:0','equipped',false,expected);assert.equal(changed.resources[0].value,8);assert.equal(changed.combat.offDefOffset,2);assert.equal(armorItems(changed)[0].equipped,false);assert.equal(changed.combat.stats.find(row=>row.name==='BE').value,0);
});

test('NSC weapons without a matching technique use the generator value zero with normal basis, focus and impairment',()=>{
 const raw=npcFixture();raw.Npc.Techniques=[];const original=JSON.stringify(raw),character=snapshot(raw),attack=character.checks.find(row=>row.id==='combat:MeleeWeapons:0:attack'),parry=character.checks.find(row=>row.id==='combat:MeleeWeapons:0:parry'),ranged=character.checks.find(row=>row.id==='combat:RangedWeapons:0:ranged');
 assert.equal(attack.reason,'');assert.equal(attack.combat.skillValue,0);assert.equal(attack.combat.skillName,'Ohne Kampftechnik');assert.equal(attack.value,6);assert.equal(parry.value,2);assert.equal(ranged.value,6);assert.equal(buildCommand(attack),'/AT Testaxt|Ohne Kampftechnik|0|6|2|0|2');
 const focus=withFocus(character,-3);assert.equal(focus.checks.find(row=>row.id===attack.id).value,1);assert.equal(focus.checks.find(row=>row.id===parry.id).value,7);assert.equal(focus.checks.find(row=>row.id===ranged.id).value,6);assert.equal(JSON.stringify(raw),original);
});

test('A known zero-valued NSC technique retains its own name while missing character techniques remain blocked',()=>{
 const raw=npcFixture();raw.Npc.Techniques.forEach(row=>{row.Value=0;});let check=normalizeCharacter(raw).checks.find(row=>row.id==='combat:MeleeWeapons:0:attack');assert.equal(check.combat.skillName,'Äxte und Beile');assert.equal(check.reason,'');
 const pc=combatFixture();pc.MeleeSkills=[];check=normalizeCharacter(pc).checks.find(row=>row.id==='combat:MeleeWeapons:0:attack');assert.match(check.reason,/nicht vollständig/);assert.throws(()=>buildCommand(check));
});

test('NSC armor reordering is also rejected before changing its equipment flag',()=>{
 const raw=npcFixture();raw.Npc.Armors.push({...raw.Npc.Armors[0],Name:'Anderer Panzer'});const before=snapshot(raw),expected=armorFingerprint(armorItems(before)[0]);raw.Npc.Armors.reverse();const current=snapshot(raw);assert.throws(()=>withArmorState(current,'Armors:0','equipped',false,expected),/neu sortiert/);assert.equal(raw.Npc.Armors[0].Equipped,true);
});
