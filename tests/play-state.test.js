import {test} from 'node:test';
import assert from 'node:assert/strict';
import {retinueFixture,npcFixture} from './fixture.js';
import {normalizeCharacter} from '../scripts/data.js';
import {conditionRows,withPlayState,retainPlayState,memberStateKey,validateLocalState,stateResources} from '../scripts/play-state.js';
import {readCompanions,withCompanionImport} from '../scripts/retinue.js';
import {withArmorState} from '../scripts/equipment.js';
import {withFocus} from '../scripts/combat.js';
import {damageFormula,rollDamage} from '../scripts/check-details.js';
import {figureTheme,weaponChoices,weaponIdentity} from '../scripts/play-tools.js';
import {validateWorkbench,checkReference,referenceKey} from '../scripts/workbench.js';
import {matchCompanionPictures} from '../scripts/character-folder.js';
import {renderView} from '../scripts/view.js';
import {savePlayState} from '../scripts/storage.js';
const snapshot=raw=>({...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw),retinueImportEnabled:true});
function local(){const data=snapshot(retinueFixture()),conditions=conditionRows(data);conditions.complex.find(row=>row.Name==='Schmerz').Level=1;return withPlayState(data,{version:1,conditions,resources:{root:{LE:12},[memberStateKey(readCompanions(data)[0])]:{LE:3}}});}

test('Local conditions rebuild from original data exactly once; resources and source bytes stay separate',()=>{
 const data=local(),again=withPlayState(data,data.localState);
 assert.equal(data.checks.find(row=>row.name==='Geographie').value,6);
 assert.equal(again.checks.find(row=>row.name==='Geographie').value,6);
 assert.equal(data.resources.find(row=>row.name==='LE').value,12);
 assert.equal(readCompanions(data)[0].CurrentLe,3);
 assert.equal(JSON.parse(data.sourceJSON).CurrentLE,31);
 assert.equal(JSON.parse(data.sourceJSON).Animals[0].CurrentLe,14);
 assert.equal(readCompanions(data)[0].InventoryId,'old-skeleton');
 const reset=withPlayState(data,{version:1});assert.equal(reset.resources[0].value,31);assert.equal(reset.checks.find(row=>row.name==='Geographie').value,8);
});
test('Import can retain conditions and resources independently without matching companions by array order',()=>{
 const before=local(),raw=retinueFixture();raw.CurrentLE=30;raw.Animals.unshift({...raw.Animals[0],InventoryId:'other',Name:'Anderes Skelett',CurrentLe:18});
 const incoming=snapshot(raw),kept=retainPlayState(before,incoming),source=retainPlayState(before,incoming,{conditions:false,resources:false,offHand:false});
 assert.equal(readCompanions(kept).find(row=>row.InventoryId==='old-skeleton').CurrentLe,3);
 assert.equal(readCompanions(kept).find(row=>row.InventoryId==='other').CurrentLe,18);
 assert.equal(kept.resources[0].value,12);assert.equal(source.resources[0].value,30);assert.equal(source.localState,undefined);
 const onlyEnergy=retainPlayState(before,incoming,{conditions:false});assert.equal(onlyEnergy.checks.find(row=>row.name==='Geographie').value,8);
});
test('Absent and duplicate companion identities never receive stored energies; saved orphan state survives',()=>{
 const before=local(),raw=retinueFixture();raw.Animals=[];
 const missing=retainPlayState(before,snapshot(raw));assert.equal(readCompanions(missing).some(row=>row.Name==='Skelett'),false);
 assert.ok(Object.keys(missing.localState.resources).some(key=>key.includes('old-skeleton')));
 raw.Animals=[...retinueFixture().Animals,...retinueFixture().Animals];
 const duplicate=retainPlayState(before,snapshot(raw));assert.ok(readCompanions(duplicate).every(row=>row.CurrentLe===14||row._group!=='animals'));
});
test('A skeleton moved from Animals to Undead keeps local energy through its globally unique inventory ID',()=>{
 const before=local(),raw=retinueFixture();raw.Undead.push(raw.Animals[0]);raw.Animals=[];
 const next=retainPlayState(before,snapshot(raw)),skeleton=readCompanions(next).find(row=>row.InventoryId==='old-skeleton');
 assert.equal(skeleton._group,'undead');assert.equal(skeleton.CurrentLe,3);
});
test('Armor and focus edits preserve local conditions and energy changes',()=>{
 const data=local(),raw=JSON.parse(data.sourceJSON);raw.Armors=[{Name:'Leder',Protection:2,BaseMobilityPenalty:1,Weight:0,OnPerson:true,IsEquiped:false}];raw.DerivedValues=Array.from({length:9},(_,index)=>({ShortName:index===0?'LE':'',TotalValue:index===8?30:index===0?31:0}));
 const rebuilt=retainPlayState(data,snapshot(raw));
 const changed=withArmorState(withFocus(rebuilt,2),'Armors:0','equipped',true);
 assert.equal(changed.resources[0].value,12);assert.equal(readCompanions(changed)[0].CurrentLe,3);assert.equal(changed.checks.find(row=>row.name==='Geographie').value,6);assert.equal(changed.combat.offDefOffset,2);
});
test('NPC energies use their own fields; automatic character conditions are rejected for NPCs',()=>{
 const data=snapshot(npcFixture()),next=withPlayState(data,{version:1,resources:{root:{LE:9,AE:4}}});
 assert.equal(next.resources.find(row=>row.name==='LE').value,9);assert.equal(next.resources.find(row=>row.name==='AE').value,4);
 assert.equal(JSON.parse(next.sourceJSON).Npc.CurrentLe,25);
 assert.throws(()=>withPlayState(data,{version:1,conditions:{simple:[],complex:[]}}),/Pedipalpus-Charaktere/);
});
test('A legacy character using local state retains armor familiarity when changing armor',()=>{
 const raw=retinueFixture();raw.CombatSpecialSkills=[{Name:'Rüstungsgewöhnung I'}];raw.Armors=[{Name:'Leder',Protection:2,BaseMobilityPenalty:2,Weight:0,OnPerson:true,IsEquiped:false}];raw.DerivedValues=Array.from({length:9},(_,index)=>({ShortName:index===0?'LE':'',TotalValue:index===8?50:index===0?31:0}));
 const original=snapshot(raw),state=withPlayState(original,{version:1,conditions:conditionRows(original)});
 assert.equal(withArmorState(state,'Armors:0','equipped',true).combat.stats.find(row=>row.name==='BE').value,1);
});
test('Single creature resources and an omitted companion import retain their original identity',()=>{
 const raw=retinueFixture(),single={Format:'Pedipalpus.Gefolge',Version:1,Name:'Skelett',Animals:raw.Animals};
 const data=withPlayState(snapshot(single),{version:1,resources:{root:{LE:2}}});assert.equal(data.resources[0].value,2);assert.equal(readCompanions(data)[0].CurrentLe,2);
 const normal=local();normal.retinueImportEnabled=false;const next=withPlayState(normal,normal.localState);assert.equal(readCompanions(next)[0].InventoryId,'old-skeleton');assert.equal(readCompanions(next)[0].CurrentLe,3);
});
test('State validator rejects invalid numbers and identities before writes',()=>{
 for(const state of [{resources:{root:{LE:NaN}}},{resources:{root:{LE:1.5}}},{resources:{'__proto__x':{LE:1}}},{conditions:{simple:[],complex:[{Name:'Schmerz',Level:99,Suppression:0}]}}])assert.throws(()=>validateLocalState(state));
 assert.equal(stateResources(local()).find(row=>row.key==='root').resources[0].value,12);
});
test('Reset after an import with companions omitted restores their own original energy baseline',()=>{
 const before=local(),incoming=retinueFixture();incoming.Animals=[];incoming.Demons=[];incoming.Undead=[];
 const merged=retainPlayState(before,withCompanionImport(before,snapshot(incoming),false));
 assert.equal(readCompanions(merged).find(row=>row.InventoryId==='old-skeleton').CurrentLe,3);
 const reset=withPlayState(merged,{version:1});assert.equal(readCompanions(reset).find(row=>row.InventoryId==='old-skeleton').CurrentLe,14);assert.equal(reset.localState,undefined);
});
test('Damage grammar accepts bounded dice terms and rejects executable or ambiguous formulas',()=>{
 assert.equal(damageFormula('2W6 + 3'),'2d6+3');assert.equal(damageFormula('1W6+1W4−2'),'1d6+1d4-2');assert.equal(damageFormula('5'),'5');
 for(const formula of ['Nach Waffe','1d6kh1','@actor.str','1d6;fetch(1)','1000d6','1d10000','0d6','1d1','1e8','(1d6)','1d6/0'])assert.equal(damageFormula(formula),null,formula);
});
test('Damage rolls honor ownership and blind mode and never invoke the skill engine',async()=>{
 const events=[];globalThis.foundry={dice:{Roll:class{constructor(formula){this.formula=formula;}async evaluate(){events.push(['evaluate',this.formula]);}async toMessage(data,options){events.push(['message',data,options]);return true;}}}};
 const actor={id:'a',name:'Wache',isOwner:true},check={name:'Hieb',damage:'1W6+2',combat:{weaponName:'<script>Hieb</script>'}};
 await rollDamage(actor,check,null,{blind:true});assert.equal(events[1][2].messageMode,'blind');assert.match(events[1][1].flavor,/&lt;script&gt;/);assert.equal(events[1][1].speaker.actor,'a');
 await assert.rejects(rollDamage({...actor,isOwner:false},check),/Besitzerrechte/);await assert.rejects(rollDamage(actor,{...check,reason:'Gesperrt'}),/Gesperrt/);assert.equal(events.length,2);
});
test('Ability details retain source data and damage without adding the saved strength bonus twice',()=>{
 const raw=retinueFixture();raw.AcademicSkills[0].Subskills[0].Description='<b>Quelle</b>';raw.AcademicSkills[0].Subskills[0].Range='5 Schritt';Object.assign(raw.Animals[0].Attacks[0],{DamageDiceCount:1,DamageDiceSides:6,DamageBonus:4,StrengthDamageBonus:2});
 const data=snapshot(raw);assert.equal(data.checks.find(row=>row.name==='Geographie').info[0].text,'<b>Quelle</b>');assert.equal(data.checks.find(row=>row.id==='animals:0:0:attack').damage,'1W6+4');
});
test('Figure preferences validate without prototype keys and keep personal themes separate',()=>{
 const prefs=validateWorkbench({textScale:130,highContrast:true,calmRows:true,figures:{a:{theme:'sneaky',rememberTheme:true,notes:{key:'Notiz'},weaponSets:[{id:'one',name:'Rapier',weapons:['key']}],activeSet:'one'},b:{theme:'warrior',rememberTheme:true}}});
 assert.equal(figureTheme(prefs,'a','fantasy'),'sneaky');assert.equal(figureTheme(prefs,'b','fantasy'),'warrior');assert.equal(figureTheme(prefs,'c','fantasy'),'fantasy');assert.equal(prefs.textScale,130);
 assert.equal(validateWorkbench({textScale:999,figures:JSON.parse('{"__proto__":{"theme":"dark"}}')}).figures.__proto__,Object.prototype);
});
test('Weapon sets use semantic identities, tolerate reorder and fall back visibly if a weapon disappears',()=>{
 const raw=retinueFixture(),data=snapshot(raw),choices=weaponChoices(data),rapier=choices.find(row=>row.name==='Rapier');assert.ok(rapier);
 const prefs=validateWorkbench({figures:{a:{weaponSets:[{id:'one',name:'Duell',weapons:[rapier.key]}],activeSet:'one'}}});
 const html=renderView({actor:{id:'a',isOwner:true},character:data,status:{ready:true},mode:'battle',preferences:prefs});assert.match(html,/Rapier/);assert.doesNotMatch(html,/data-check-id="combat:RangedWeapons/);assert.match(html,/data-companion-section/);
 raw.MeleeWeapons=[];const stale=renderView({actor:{id:'a',isOwner:true},character:snapshot(raw),status:{ready:true},mode:'battle',preferences:prefs});assert.match(stale,/Set unvollständig/);assert.match(stale,/data-check-id="combat:RangedWeapons/);
 assert.equal(weaponIdentity(data.checks.find(row=>row.id==='combat:MeleeWeapons:0:attack')),rapier.key);
});
test('Notes, details and companion shortcuts do not inject HTML or replace the actual roll reference',()=>{
 const data=local(),check=data.checks.find(row=>row.id==='animals:0:0:attack'),html=renderView({actor:{id:'a',isOwner:true},character:data,status:{ready:true},mode:'battle',favoriteKeys:[check.id]});
 assert.match(html,/pp-companion-quick/);assert.match(html,/data-action="roll"[^>]*data-check="animals:0:0:attack"/);
 assert.ok(referenceKey(checkReference(check)).includes('Skelett'.toLowerCase()));
});
test('Bulk portraits match exact saved filenames or unique creature names; ambiguous names fail before image reads',()=>{
 const members=[{Name:'Skelett'},{Name:'Wache',PortraitFileName:'portrait-2.png'}],files=[{name:'Skelett.jpg',size:20},{name:'portrait-2.png',size:30},{name:'fremd.png',size:10}];
 assert.equal(matchCompanionPictures(members,files).length,2);assert.throws(()=>matchCompanionPictures([{Name:'Skelett'},{Name:'Skelett'}],files),/mehrfach/);assert.throws(()=>matchCompanionPictures(members,[...files,{name:'Skelett.png',size:30}]),/mehrere/);
});
test('State writes require owner/update rights and reject stale data before any write',async()=>{
 let data=snapshot(retinueFixture()),writes=0;globalThis.game={user:{id:'owner'},actors:{contents:[]}};
 const actor={id:'owner-actor',isOwner:false,canUserModify:()=>true,getFlag:(_namespace,key)=>key==='character'?data:undefined,async setFlag(_namespace,_key,value){writes++;data=value;}};
 game.actors.contents.push(actor);game.actors.get=id=>game.actors.contents.find(row=>row.id===id);
 await assert.rejects(savePlayState(actor,{version:1},JSON.stringify(data)),/Besitzerrechte/);actor.isOwner=true;
 await assert.rejects(savePlayState(actor,{version:1},'stale'),/inzwischen geändert/);assert.equal(writes,0);
 await savePlayState(actor,{version:1,resources:{root:{LE:8}}},JSON.stringify(data));assert.equal(writes,1);assert.equal(data.resources[0].value,8);
});
