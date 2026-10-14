import {test} from 'node:test';
import assert from 'node:assert/strict';
import {combatFixture} from './fixture.js';
import {normalizeCharacter} from '../scripts/data.js';
import {withArmorState,recalculateArmor,armorItems} from '../scripts/equipment.js';
import {characterFiles,matchingPortrait,readCharacterWithPortrait} from '../scripts/character-folder.js';
import {applyPortrait} from '../scripts/portraits.js';
import {validateWorkbench} from '../scripts/workbench.js';
import {companionKey,companionSnapshot,refreshCompanions,saveCompanion} from '../scripts/companions.js';
import {validSnapshot} from '../scripts/data.js';
import {readLiveSource,directoryCharacters} from '../scripts/import-source.js';

function armorFixture(){const raw=combatFixture();raw.DerivedValues=Array.from({length:9},(_,i)=>({LongName:'Wert',TotalValue:i===8?20:0}));raw.Be=2;raw.Armors=[{Name:'Kette',Protection:5,MobilityPenalty:2,BaseMobilityPenalty:2,Weight:8,Quantity:1,OnPerson:true,IsEquiped:true},{Name:'Helm',Protection:2,MobilityPenalty:1,BaseMobilityPenalty:1,Weight:2,Quantity:1,OnPerson:false,IsEquiped:false}];return raw;}
test('Armor changes preserve focus, update protection/BE and attacks, clear equipped when removed and export original states',()=>{
 const raw=armorFixture(),source=JSON.stringify(raw),snapshot={...normalizeCharacter(raw),sourceJSON:source};
 const original=structuredClone(snapshot),next=withArmorState(snapshot,'Armors:1','equipped',true),saved=JSON.parse(next.sourceJSON);
 assert.equal(saved.GRS,7);assert.equal(saved.Be,3);assert.equal(saved.Armors[1].OnPerson,true);assert.equal(saved.Armors[1].IsEquiped,true);
 assert.equal(next.combat.offDefOffset,-4);assert.deepEqual(snapshot,original);
 assert.equal(next.checks.find(c=>c.id==='combat:MeleeWeapons:0:attack').value,snapshot.checks.find(c=>c.id==='combat:MeleeWeapons:0:attack').value-1);
 const removed=withArmorState(next,'Armors:0','carried',false);assert.equal(armorItems(removed)[0].equipped,false);assert.equal(JSON.parse(removed.sourceJSON).GRS,2);
});
test('Armor overload follows character load including containers; animal carriers are excluded and cannot equip on the character',()=>{
 const raw=armorFixture();raw.GeneralItems=[{Weight:19,Quantity:1,OnPerson:true},{Weight:500,Quantity:1,OnPerson:true,CarrierAnimalId:'pet'}];
 raw.InventoryContainers=[{Weight:1,OnPerson:true,IsCarried:true,Items:[{Weight:6,Quantity:1,OnPerson:true},{Weight:99,OnPerson:false}]}];
 recalculateArmor(raw);assert.equal(raw.CarriedWeight,34);assert.equal(raw.Be,4);
 const snapshot={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};
 raw.Armors[0].CarrierAnimalId='pet';assert.throws(()=>withArmorState({...snapshot,sourceJSON:JSON.stringify(raw)},'Armors:0','equipped',true),/Tier/);
 assert.throws(()=>withArmorState(snapshot,'../','carried',true),/ungültig/);
 assert.throws(()=>withArmorState(snapshot,'Armors:0','carried','true'),/ungültig/);
});
test('Missing base armor data fails without changing the original character',()=>{
 const raw=armorFixture();delete raw.Armors[0].BaseMobilityPenalty;const snapshot={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};
 assert.throws(()=>withArmorState(snapshot,'Armors:1','equipped',true),/Basis-BE/);assert.equal(JSON.parse(snapshot.sourceJSON).Armors[1].IsEquiped,false);
});
test('Folder import finds the referenced portrait only among selected files and rejects ambiguous names or path traversal',async()=>{
 const raw=combatFixture(),json=new File([JSON.stringify(raw)],'Testcharakter.json');Object.defineProperty(json,'webkitRelativePath',{value:'Pedipalpus/SavedCharacters/Testcharakter.json'});
 const image=new File(['selected-image'],'Testcharakter.png');Object.defineProperty(image,'webkitRelativePath',{value:'Pedipalpus/CharacterPortraits/Testcharakter.png'});
 const gameData=new File(['{}'],'catalog.json');Object.defineProperty(gameData,'webkitRelativePath',{value:'Pedipalpus/GameData/catalog.json'});
 assert.deepEqual(characterFiles([gameData,json,image]),[json]);assert.equal((await readCharacterWithPortrait(json,[image])).portrait,image);
 assert.equal(matchingPortrait([image],'testcharakter.PNG'),image);assert.equal(matchingPortrait([],'Testcharakter.png'),null);
 assert.throws(()=>matchingPortrait([image,image],'Testcharakter.png'),/mehrfach/);assert.throws(()=>matchingPortrait([image],'../Testcharakter.png'),/ungültig/);
});
test('Portrait and token image paths remain separate; only editable linked tokens receive the round image',async()=>{
 const updates=[];globalThis.game={user:{id:'owner'},scenes:{contents:[{tokens:{contents:[{actorId:'a',actorLink:true,canUserModify:()=>true,update:async value=>updates.push(value)},{actorId:'a',actorLink:false,canUserModify:()=>true,update:async()=>assert.fail('Unlinked token changed')} ]}}]}};
 const actor={id:'a',canUserModify:()=>true,update:async value=>updates.push(value)};
 await applyPortrait(actor,'worlds/test/portrait.png',()=>{},'worlds/test/token.png');assert.deepEqual(updates,[{img:'worlds/test/portrait.png','prototypeToken.texture.src':'worlds/test/token.png'},{'texture.src':'worlds/test/token.png'}]);
});
test('Original frame preference defaults to Concrete and rejects arbitrary frame paths',()=>{
 assert.equal(validateWorkbench({}).tokenFrame,'concrete');assert.equal(validateWorkbench({tokenFrame:'undead'}).tokenFrame,'undead');assert.equal(validateWorkbench({tokenFrame:'https://elsewhere/image.png'}).tokenFrame,'concrete');
});
test('Companions retain stable identity across reordering and reject ambiguous old names',()=>{
 const raw=combatFixture();raw.Animals[0].InventoryId='wolf-id';raw.Animals.push({Name:'Pferd',InventoryId:'horse-id',Attacks:[]});
 const character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};const key=companionKey(character,0),pet=companionSnapshot(character,0);
 assert.equal(key,'id:wolf-id');assert.equal(validSnapshot(pet),true);assert.equal(pet.profile.name,'Wolf');assert.equal(pet.checks.length,2);assert.ok(pet.checks.every(c=>c.id.startsWith('animals:0:')));assert.equal(pet.sourceJSON,undefined);
 raw.Animals.reverse();assert.equal(companionKey({...character,sourceJSON:JSON.stringify(raw)},1),key);
 raw.Animals=[{Name:'Wolf',Attacks:[]},{Name:'Wolf',Attacks:[]}];assert.throws(()=>companionKey({...character,sourceJSON:JSON.stringify(raw)},0),/eindeutig/);
});
test('Parent reimport refreshes animal probes without replacing portraits; removed pets keep their actor but no stale rolls',async()=>{
 const raw=combatFixture();raw.Animals[0].InventoryId='wolf-id';const character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)},changes=[];
 const child={img:'portrait.png',name:'Wolf',getFlag:(_ns,key)=>key==='companion'?{sourceActorId:'parent',key:'id:wolf-id'}:companionSnapshot(character,0),canUserModify:()=>true,setFlag:async(_ns,_key,value)=>changes.push(value)};
 globalThis.game={user:{id:'owner'},actors:{contents:[child]}};const source={id:'parent',getFlag:()=>character};await refreshCompanions(source);assert.equal(changes[0].checks.length,2);assert.equal(child.img,'portrait.png');
 const removed={...character,sourceJSON:JSON.stringify({...raw,Animals:[]})};source.getFlag=()=>removed;await refreshCompanions(source);assert.equal(changes[1].checks.length,0);
});
test('Animal creation permission and stale references fail before image upload',async()=>{
 const raw=combatFixture(),character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};globalThis.game={user:{id:'owner'},actors:{contents:[]}};globalThis.foundry={documents:{Actor:{canUserCreate:()=>false}}};
 const source={id:'parent',isOwner:true,canUserModify:()=>true,getFlag:()=>character};
 await assert.rejects(saveCompanion(source,0,companionKey(character,0),{}),/Spielleiter/);
 await assert.rejects(saveCompanion(source,0,'old-reference',{}),/inzwischen/);
 source.isOwner=false;await assert.rejects(saveCompanion(source,0,'old-reference',{}),/Besitzerrechte/);
});
test('Refresh reads fresh bytes from the granted source handle and resolves a newly referenced picture',async()=>{
 const raw=combatFixture();let current=JSON.stringify(raw),reads=0;
 const handle={kind:'file',name:'character.json',queryPermission:async()=> 'granted',getFile:async()=>{reads++;return new File([current],'character.json');}};
 const image=new File(['selected'],'new-picture.png'),directory={queryPermission:async()=> 'granted',getDirectoryHandle:async name=>{assert.equal(name,'CharacterPortraits');return {getFileHandle:async filename=>{assert.equal(filename,'new-picture.png');return {getFile:async()=>image};}};}};
 assert.equal(JSON.parse((await readLiveSource({fileHandle:handle})).json).Name,'Testcharakter');
 raw.Name='Aktueller Stand';raw.PortraitFileName='new-picture.png';current=JSON.stringify(raw);
 const refreshed=await readLiveSource({fileHandle:handle,directoryHandle:directory});assert.equal(JSON.parse(refreshed.json).Name,'Aktueller Stand');assert.equal(refreshed.portrait,image);assert.equal(reads,2);
 await assert.rejects(readLiveSource({fileHandle:{queryPermission:async()=> 'denied',requestPermission:async()=> 'denied',getFile:()=>assert.fail('Denied file read')}}),/zugänglich/);
});
test('Directory source selection lists character handles without reading unrelated files',async()=>{
 const entries=[{kind:'file',name:'z.json'},{kind:'file',name:'a.json'},{kind:'file',name:'program.exe',getFile:()=>assert.fail('Unrelated file read')}];
 const saved={async *values(){yield* entries;}};
 const root={queryPermission:async()=> 'granted',getDirectoryHandle:async name=>{assert.equal(name,'SavedCharacters');return saved;}};
 assert.deepEqual((await directoryCharacters(root)).map(handle=>handle.name),['a.json','z.json']);
});
