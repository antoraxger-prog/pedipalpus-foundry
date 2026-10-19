import {test} from 'node:test';
import assert from 'node:assert/strict';
import {npcFixture,combatFixture,retinueFixture} from './fixture.js';
import {normalizeCharacter,parseCharacter} from '../scripts/data.js';
import {NPC_FORMAT,mapNpcFile,npcRound,withNpcAttributes,retainNpcChoices} from '../scripts/npc.js';
import {buildCommand} from '../scripts/commands.js';
import {withFocus} from '../scripts/combat.js';
import {checkReference,referenceKey,resolveCheck} from '../scripts/workbench.js';
import {companionKey,companionSnapshot,refreshCompanions} from '../scripts/companions.js';
import {withCompanionAttributes,readCompanions,retainCompanionChoices} from '../scripts/retinue.js';
import {armorItems,withArmorState} from '../scripts/equipment.js';
import {saveCharacter} from '../scripts/storage.js';
import {writeCharacterBundle,readCharacterFile} from '../scripts/bundle.js';
import {characterFiles} from '../scripts/character-folder.js';
import {directoryCharacters} from '../scripts/import-source.js';
import {checksForView,mastery,renderView} from '../scripts/view.js';

const snapshot=raw=>({...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)});
const find=(character,id)=>character.checks.find(check=>check.id===id);

test('NPC format is explicitly recognized and recalculates totals instead of trusting cached values',()=>{
 const raw=npcFixture(),before=structuredClone(raw);raw.Npc.Attributes[0].Total=10000;raw.Npc.Powers[0].Value=10000;
 const character=normalizeCharacter(raw);
 assert.equal(character.sourceFormat,NPC_FORMAT);assert.equal(character.sourceVersion,1);assert.equal(character.profile.name,'Alrik Testwache');
 assert.equal(character.attributes[0].value,12);assert.equal(character.resources.find(value=>value.name==='LE').max,31);assert.equal(character.resources.find(value=>value.name==='AE').max,22);assert.equal(character.resources.find(value=>value.name==='KE').max,9);
 assert.equal(find(character,'Spells:0').value,16);assert.equal(find(character,'Spells:1').value,8);assert.equal(find(character,'Miracles:0').value,4);
 assert.ok(find(character,'Spells:2').reason);assert.ok(find(character,'Rituals:0').reason);assert.ok(character.warnings.some(warning=>warning.includes('Ohne Merkmal')));
 delete raw.Npc.Attributes[0].Total;delete raw.Npc.Powers[0].Value;assert.deepEqual(raw,before);
});

test('NPC attribute rounding, dependent derived modifiers and negative halves match the generator',()=>{
 const raw=npcFixture();raw.Npc.Derived.find(row=>row.Key==='DEF').Modifier=2;
 raw.Npc.Attributes.find(row=>row.Key==='MU').RaceModifier=-1;raw.Npc.Attributes.find(row=>row.Key==='MU').Modifier=2;
 const character=normalizeCharacter(raw);
 assert.equal(character.attributes[0].value,13);assert.equal(find(character,'combat:NpcDodge:0:parry').value,11);
 assert.deepEqual([npcRound(.5),npcRound(-.5),npcRound(1.5),npcRound(-1.5)],[1,-1,2,-2]);
 raw.Npc.Derived.find(row=>row.Key==='WA').Modifier=-20.75;assert.equal(find(normalizeCharacter(raw),'NpcDerived:WA').value,-14);
});

test('NPC combat uses its own ranged tolerance and shield training without hidden weight impairment',()=>{
 const character=normalizeCharacter(npcFixture());
 assert.equal(buildCommand(find(character,'combat:MeleeWeapons:0:attack')),'/AT Testaxt|Äxte und Beile|12|6|2|0|2');
 assert.equal(buildCommand(find(character,'combat:MeleeWeapons:0:parry')),'/PA Testaxt|Äxte und Beile|12|6|-2|0|2');
 assert.equal(buildCommand(find(character,'combat:RangedWeapons:0:ranged')),'/FK Testbogen|Bögen|12|6|1|1');
 assert.equal(buildCommand(find(character,'combat:ParryWeapons:0:parry')),'/PA Testschild|Schwerter|12|6|-2|3|3');
 assert.equal(find(character,'combat:MeleeWeapons:0:attack').value,18);assert.equal(find(character,'combat:MeleeWeapons:0:parry').value,14);
 const next=withFocus(character,-3);assert.equal(find(next,'combat:MeleeWeapons:0:attack').value,13);assert.equal(find(next,'combat:MeleeWeapons:0:parry').value,19);
 assert.deepEqual(find(next,'combat:NpcDodge:0:parry'),find(character,'combat:NpcDodge:0:parry'));assert.deepEqual(find(next,'combat:RangedWeapons:0:ranged'),find(character,'combat:RangedWeapons:0:ranged'));
 const normal=combatFixture();normal._npc=true;assert.equal(find(normalizeCharacter(normal),'combat:RangedWeapons:0:ranged').combat.mobilityPenalty,3);
});

test('Tied NPC techniques follow their stored order and removed techniques cannot invent a roll',()=>{
 const raw=npcFixture();raw.Npc.Weapons[0].Techniques='Schwerter; Äxte und Beile';
 assert.equal(find(normalizeCharacter(raw),'combat:MeleeWeapons:0:attack').combat.skillName,'Äxte und Beile');
 raw.Npc.Techniques.reverse();assert.equal(find(normalizeCharacter(raw),'combat:MeleeWeapons:0:attack').combat.skillName,'Schwerter');
 raw.Npc.Weapons[0].Techniques='Nicht vorhanden';assert.ok(find(normalizeCharacter(raw),'combat:MeleeWeapons:0:attack').reason);
});

test('Duplicate and umlaut-equivalent NPC technique names still use the highest technique value',()=>{
 const raw=npcFixture();raw.Npc.Techniques.push({Name:'Aexte und Beile',Type:'Melee',Value:17});
 assert.equal(find(normalizeCharacter(raw),'combat:MeleeWeapons:0:attack').combat.skillValue,17);
 raw.Npc.Features[1].Name='Objekt ';assert.equal(find(normalizeCharacter(raw),'Spells:0').value,12);
});

test('NPC restrictions cannot spill into existing companion files through unknown input fields',()=>{
 const raw=retinueFixture();raw.Demons[0].npcRules=true;
 const character=snapshot(raw),chosen=withCompanionAttributes(character,'demons:0:mundane:0',['MU','MU','MU']);
 assert.deepEqual(find(chosen,'demons:0:mundane:0').attributes.map(attr=>attr.short),['MU','MU','MU']);
});

test('General abilities and features choose current own attributes and preserve the original NPC file',()=>{
 const character=snapshot(npcFixture()),original=character.sourceJSON;
 assert.ok(checksForView(character).some(check=>check.id==='NpcAbilities:0'));assert.equal(find(character,'NpcAbilities:0').needsAttributes,true);
 const chosen=withNpcAttributes(character,'NpcAbilities:0',['MU','MU','KO']);
 assert.equal(buildCommand(find(chosen,'NpcAbilities:0')),'/skillcheck Einbrechen | Mut 12 | Mut 12 | Konstitution 13 | 12');
 assert.equal(chosen.sourceJSON,original);assert.throws(()=>withNpcAttributes(character,'NpcAbilities:0',['MU','MU','MU']),/nicht gleich/);
 assert.throws(()=>withNpcAttributes(character,'NpcAbilities:0',['MU','XX','KO']),/vorhandene/);
 const fresh=retainNpcChoices(chosen,snapshot(npcFixture()));assert.deepEqual(find(fresh,'NpcAbilities:0').npcChoice.keys,['MU','MU','KO']);
 const moved=npcFixture();moved.Npc.Abilities.unshift({Name:'Andere',Grade:'Amateur'});assert.deepEqual(find(retainNpcChoices(chosen,snapshot(moved)),'NpcAbilities:1').npcChoice.keys,['MU','MU','KO']);
 moved.Npc.Abilities.push({Name:'Einbrechen',Grade:'Amateur'});assert.equal(find(retainNpcChoices(chosen,snapshot(moved)),'NpcAbilities:1').needsAttributes,true);
 assert.equal(mastery(find(character,'NpcAbilities:0')).label,'Geselle');assert.equal(mastery(find(character,'NpcDerived:WA')).scale,'other');
});

test('All seven NPC retinue kinds preserve own checks and stable identity through reordering',()=>{
 const raw=npcFixture(),character=snapshot(raw),groups=['animals','demons','undead','chimeras','persons','elementals','golems'];
 assert.deepEqual(readCompanions(character).map(member=>member._group),groups);
 for(let index=0;index<groups.length;index++){
  const group=groups[index],child=companionSnapshot(character,index);
  assert.ok(child.checks.every(check=>check.id.startsWith(`${group}:0:`)));assert.equal(child.sourceFormat,NPC_FORMAT);
  assert.match(buildCommand(find(character,`${group}:0:attribute:MU`)),/ 8$/);
  const choice=withCompanionAttributes(child,`${group}:0:mundane:0`,['MU','MU','IN']);assert.match(buildCommand(find(choice,`${group}:0:mundane:0`)),/Mut 8 \| Mut 8 \| Intuition 8/);
  assert.throws(()=>withCompanionAttributes(child,`${group}:0:mundane:0`,['MU','MU','MU']),/nicht gleich/);
 }
 assert.equal(find(character,'elementals:0:0:parry'),undefined);assert.match(buildCommand(find(character,'elementals:0:0:ranged')),/^\/FK /);
 raw.Npc.Retinue.reverse();assert.equal(companionKey(snapshot(raw),2),companionKey(character,2));
 raw.Npc.Retinue.push(structuredClone(raw.Npc.Retinue.find(row=>row.Kind==='Tier')));assert.throws(()=>companionKey(snapshot(raw),0),/eindeutig/);
 const chosen=withCompanionAttributes(character,'undead:0:mundane:0',['MU','MU','IN']);assert.deepEqual(find(retainCompanionChoices(chosen,snapshot(npcFixture())),'undead:0:mundane:0').companionAbility.keys,['MU','MU','IN']);
});

test('NPC armor toggles only Equipped, recalculates NPC BE, retains focus and exports its original shape',()=>{
 const character=withFocus(snapshot(npcFixture()),-1),chosen=withNpcAttributes(character,'NpcAbilities:0',['MU','IN','KO']);
 const next=withArmorState(chosen,'Armors:0','equipped',false),file=JSON.parse(next.sourceJSON);
 assert.equal(file.Format,NPC_FORMAT);assert.equal(file.Npc.Focus,-1);assert.equal(file.Npc.Armors[0].Equipped,false);assert.equal('OffOffset' in file,false);assert.equal('OnPerson' in file.Npc.Armors[0],false);
 assert.equal(find(next,'combat:RangedWeapons:0:ranged').combat.mobilityPenalty,0);assert.equal(armorItems(next)[0].carried,null);assert.deepEqual(find(next,'NpcAbilities:0').npcChoice.keys,['MU','IN','KO']);
 assert.throws(()=>withArmorState(chosen,'Armors:0','carried',false),/keinen Dabei/);
 const html=renderView({actor:{isOwner:true},character:next,status:{ready:true,combatReady:true},mode:'battle'});assert.doesNotMatch(html,/data-armor-field="carried"/);assert.match(html,/data-armor-field="equipped"/);
});

test('Character and NPC macros with identical names cannot resolve across formats',()=>{
 const normal=normalizeCharacter(combatFixture()),npc=normalizeCharacter(npcFixture());
 const a=find(normal,'primary:0'),b=find(npc,'primary:0');assert.equal(a.name,b.name);assert.notEqual(referenceKey(checkReference(a)),referenceKey(checkReference(b)));
 assert.throws(()=>resolveCheck(npc,checkReference(a)),/nicht mehr/);assert.throws(()=>resolveCheck(normal,checkReference(b)),/nicht mehr/);
});

test('Format, version, mixed structures, unknown grades and malformed numeric inputs fail before import',()=>{
 for(const change of [raw=>raw.Version=2,raw=>raw.Format='Other',raw=>raw.Name='Hybrid',raw=>raw.PrimaryAttributes=[],raw=>raw.Npc.Attributes.push(structuredClone(raw.Npc.Attributes[0])),raw=>raw.Npc.Abilities[0].Grade='???',raw=>raw.Npc.Attributes[0].BaseValue='12',raw=>raw.Npc.Derived=[],raw=>raw.Npc.LifeFactor=0,raw=>raw.Npc.Focus=5,raw=>raw.Npc.Retinue[0].Kind='???']){
  const raw=npcFixture();change(raw);assert.throws(()=>parseCharacter(JSON.stringify(raw)),/NSC-Datei/);
 }
 const raw=npcFixture();raw.Npc.Abilities[0].Name='Name|Feld\n/AT';const check=find(normalizeCharacter(raw),'NpcAbilities:0');assert.equal(check.name,'Name/Feld /AT');
});

test('Wrong-format targets, linked child actors and concurrent edits are rejected without changing them',async()=>{
 const character=snapshot(combatFixture()),npc=snapshot(npcFixture());let saved=character,child=false,writes=0;
 const actor={isOwner:true,canUserModify:()=>true,getFlag:(_ns,key)=>key==='companion'?(child?{sourceActorId:'parent'}:undefined):saved,setFlag:async()=>writes++};
 globalThis.game={system:{id:'worldbuilding'},user:{id:'owner'},actors:{get:()=>actor}};
 await assert.rejects(saveCharacter(npc,'actor'),/nicht überschreiben/);saved=npc;await assert.rejects(saveCharacter(character,'actor'),/nicht überschreiben/);
 child=true;await assert.rejects(saveCharacter(npc,'actor'),/Begleiter/);child=false;
 await assert.rejects(saveCharacter(npc,'actor',null,null,JSON.stringify({...npc,profile:{name:'stale'}})),/inzwischen geändert/);assert.equal(writes,0);
 await saveCharacter(npc,'actor',null,null,JSON.stringify(npc));assert.equal(writes,1);
});

test('NPC ZIP round-trip retains its own marker, extension and unknown future metadata',async()=>{
 const raw=npcFixture();raw.Npc.FutureNotes={text:'erhalten'};const json=JSON.stringify(raw),zip=await writeCharacterBundle(json);
 assert.ok(new TextDecoder().decode(await zip.arrayBuffer()).includes('npc.nsc.json'));
 const result=await readCharacterFile(new File([zip],'npc.zip'));assert.equal(result.json,json);assert.equal(parseCharacter(result.json).sourceFormat,NPC_FORMAT);
});

test('Character and NPC folders can be selected together without reading unrelated catalogs',async()=>{
 const make=(name,path)=>{const file=new File(['{}'],name);Object.defineProperty(file,'webkitRelativePath',{value:path});return file;};
 const files=[make('a.json','App/SavedCharacters/a.json'),make('b.nsc.json','App/SavedNpcs/b.nsc.json'),make('catalog.json','App/GameData/catalog.json')];assert.equal(characterFiles(files).length,2);
 const directory={getDirectoryHandle:async name=>({async *values(){yield {kind:'file',name:name==='SavedCharacters'?'a.json':'b.nsc.json'};}})};
 assert.deepEqual((await directoryCharacters(directory)).map(file=>file.name),['a.json','b.nsc.json']);
});

test('Separate folder lists keep player files and NPC files apart, including a directly selected SavedNpcs directory',async()=>{
 const make=(name,path)=>{const file=new File(['{}'],name);Object.defineProperty(file,'webkitRelativePath',{value:path});return file;};
 const pc=make('a.json','App/SavedCharacters/a.json'),npc=make('b.nsc.json','App/SavedNpcs/b.nsc.json'),renamed=make('c.json','App/SavedNpcs/c.json'),catalog=make('catalog.json','App/GameData/catalog.json');
 assert.deepEqual(characterFiles([pc,npc,renamed,catalog],'character'),[pc]);assert.deepEqual(characterFiles([pc,npc,renamed,catalog],'npc'),[npc,renamed]);
 const handle=name=>({kind:'file',name,getFile:()=>assert.fail('Listing must not open a file')});
 const folder=(name,files)=>({name,async *values(){yield* files;},getDirectoryHandle:async()=>{throw new Error('No subdirectory');}});
 const pcs=folder('SavedCharacters',[handle('a.json')]),npcs=folder('SavedNpcs',[handle('b.nsc.json'),handle('c.json')]);
 const root={getDirectoryHandle:async name=>name==='SavedCharacters'?pcs:npcs};
 assert.deepEqual((await directoryCharacters(root,'character')).map(file=>file.name),['a.json']);assert.deepEqual((await directoryCharacters(root,'npc')).map(file=>file.name),['b.nsc.json','c.json']);
 assert.deepEqual((await directoryCharacters(pcs,'npc')).map(file=>file.name),[]);assert.deepEqual((await directoryCharacters(npcs,'npc')).map(file=>file.name),['b.nsc.json','c.json']);
});
