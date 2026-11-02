import {test} from 'node:test';
import assert from 'node:assert/strict';
import {retinueFixture,npcFixture} from './fixture.js';
import {parseCharacter,RETINUE_FORMAT} from '../scripts/data.js';
import {retinueSourceJSON} from '../scripts/retinue-source.js';
import {readCompanions,isCompanionCheck,withCompanionAttributes} from '../scripts/retinue.js';
import {buildCommand} from '../scripts/commands.js';
import {characterFiles,readCharacterWithPortrait} from '../scripts/character-folder.js';
import {directoryCharacters,directoryFilePath,readLiveSource} from '../scripts/import-source.js';
const file=(name,raw,relative='')=>({name,size:JSON.stringify(raw).length,webkitRelativePath:relative,text:async()=>JSON.stringify(raw)});
const dir=(name,entries=[],folders={})=>({kind:'directory',name,queryPermission:async()=> 'granted',async *values(){yield*entries;},async getDirectoryHandle(key){if(folders[key])return folders[key];throw Object.assign(new Error('Missing'),{name:'NotFoundError'});}});
test('Character extraction keeps every creature probe, identity and resource, without main-character data',()=>{
 const raw=retinueFixture(),json=JSON.stringify({...raw,PortraitFileName:'main.png'}),before=parseCharacter(json),result=retinueSourceJSON(json),parsed=parseCharacter(result);
 assert.equal(parsed.sourceFormat,RETINUE_FORMAT);assert.equal(parsed.profile.retinueOnly,true);
 assert.deepEqual(parsed.checks,before.checks.filter(isCompanionCheck));assert.deepEqual(readCompanions(parsed),readCompanions(before));
 assert.equal(parsed.profile.portraitFileName,'');assert.equal(JSON.parse(result).PrimaryAttributes,undefined);assert.equal(JSON.parse(result).MeleeSkills,undefined);assert.equal(JSON.parse(result).Notes,undefined);assert.equal(JSON.stringify({...raw,PortraitFileName:'main.png'}),json);
});
test('All seven NPC companion kinds retain their commands and NPC attribute rules',()=>{
 const json=JSON.stringify(npcFixture()),before=parseCharacter(json),after=parseCharacter(retinueSourceJSON(json));
 const withoutSource=checks=>checks.map(({sourceFormat,...row})=>row);
 assert.equal(readCompanions(after).length,7);assert.deepEqual(withoutSource(after.checks),withoutSource(before.checks.filter(isCompanionCheck)));
 for(const check of after.checks.filter(row=>!row.reason&&!row.needsAttributes))assert.equal(buildCommand(check),buildCommand(before.checks.find(row=>row.id===check.id)));
 const check=after.checks.find(row=>row.companionAbility&&row.needsAttributes);assert.ok(check);
 assert.throws(()=>withCompanionAttributes(after,check.id,['MU','MU','MU']));
 assert.equal(withCompanionAttributes(after,check.id,['MU','KL','IN']).checks.find(row=>row.id===check.id).npcRules,true);
});
test('Legacy identifiers survive reorder and ambiguous identities fail before import',()=>{
 const raw=retinueFixture();delete raw.Animals[0].InventoryId;delete raw.Undead[0].InventoryId;
 const first=JSON.parse(retinueSourceJSON(JSON.stringify(raw)));raw.Undead.unshift({...raw.Undead[0],Name:'Andere Wache'});
 const next=JSON.parse(retinueSourceJSON(JSON.stringify(raw)));assert.equal(next.Undead[1].InventoryId,first.Undead[0].InventoryId);
 raw.Undead.push({...raw.Undead[1]});assert.throws(()=>retinueSourceJSON(JSON.stringify(raw)),/nicht eindeutig/);
});
test('Prepared files pass through unchanged, empty or incomplete sources never invent creatures or attributes',()=>{
 const raw=retinueFixture(),prepared=JSON.stringify({Format:RETINUE_FORMAT,Version:1,Name:'Bibliothek',Undead:raw.Undead},null,2);assert.equal(retinueSourceJSON(prepared),prepared);
 raw.Animals=[];raw.Demons=[];raw.Undead=[];assert.throws(()=>retinueSourceJSON(JSON.stringify(raw)),/kein Gefolge/);
 raw.Animals=[{Name:'Alt',Species:'Tier',InventoryId:'old'}];assert.throws(()=>retinueSourceJSON(JSON.stringify(raw)),/Attribut/);
 assert.throws(()=>retinueSourceJSON('{'));assert.throws(()=>retinueSourceJSON(JSON.stringify({...JSON.parse(prepared),NpcRules:'false'})),/ungültig/);
});
test('Native and fallback directories keep same-named sources distinct and do not read unrelated files',async()=>{
 const a={kind:'file',name:'gleich.json'},b={kind:'file',name:'gleich.json'},c={kind:'file',name:'paket.json'},ignored={kind:'file',name:'tool.exe',getFile:()=>assert.fail('Executable read')};
 const root=dir('Pedipalpus',[c,ignored],{SavedCharacters:dir('SavedCharacters',[a]),SavedNpcs:dir('SavedNpcs',[b])});
 assert.deepEqual((await directoryCharacters(root,'retinue')).map(directoryFilePath),['paket.json','SavedCharacters/gleich.json','SavedNpcs/gleich.json']);
 assert.deepEqual(await directoryCharacters(root,'character'),[a]);assert.deepEqual(await directoryCharacters(root,'npc'),[b]);
 const files=['Pedipalpus/SavedCharacters/gleich.json','Pedipalpus/SavedNpcs/gleich.json','Pedipalpus/paket.json','Pedipalpus/GameData/settings.json','Pedipalpus/app.exe'].map(p=>file(p.split('/').at(-1),{},p));
 assert.deepEqual(characterFiles(files,'retinue').map(f=>f.webkitRelativePath),files.slice(0,3).map(f=>f.webkitRelativePath).sort((a,b)=>a.localeCompare(b,'de')));
 assert.equal(directoryFilePath(file('plain.json',{})),'plain.json');
 await assert.rejects(()=>directoryCharacters({...root,queryPermission:async()=> 'denied'},'retinue'),/nicht freigegeben/);
});
test('Single extracted companion uses its own portrait and refresh stays companion-only',async()=>{
 const raw=retinueFixture();raw.Demons=[];raw.Undead=[];raw.PortraitFileName='main.png';raw.Animals[0].PortraitFileName='skeleton.png';
 const sourceFile=file('held.json',raw),portrait=file('skeleton.png',{},'Pedipalpus/CharacterPortraits/skeleton.png'),main=file('main.png',{},'Pedipalpus/CharacterPortraits/main.png');
 const imported=await readCharacterWithPortrait(sourceFile,[main,portrait],{retinueOnly:true});assert.equal(imported.portrait,portrait);assert.equal(parseCharacter(imported.json).profile.name,'Skelett');
 const source={fileHandle:{getFile:async()=>sourceFile},retinueOnly:true};const refreshed=await readLiveSource(source,{includePortrait:false});assert.deepEqual(JSON.parse(refreshed.json),JSON.parse(imported.json));assert.ok(parseCharacter(refreshed.json).checks.every(isCompanionCheck));
 const unchanged=await readCharacterWithPortrait(sourceFile,[main,portrait]);assert.equal(unchanged.portrait,main);assert.equal(parseCharacter(unchanged.json).profile.retinueOnly,undefined);
 delete raw.Animals[0].PortraitFileName;assert.equal((await readCharacterWithPortrait(sourceFile,[main],{retinueOnly:true})).portrait,null);
});
