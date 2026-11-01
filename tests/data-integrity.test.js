import {test} from 'node:test';
import assert from 'node:assert/strict';
import {retinueFixture} from './fixture.js';
import {normalizeCharacter,MODULE_ID} from '../scripts/data.js';
import {readCompanions} from '../scripts/retinue.js';
import {withPlayState,retainPlayState,compactLocalState,memberStateKey,stateResources} from '../scripts/play-state.js';
import {companionSnapshot,companionKey,prepareCompanionImport,applyCompanionImport} from '../scripts/companions.js';
import {compareCharacters} from '../scripts/import-diff.js';
import fs from 'node:fs';
import vm from 'node:vm';
import {executeCheck} from '../scripts/commands.js';

const snapshot=raw=>({...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)});
function runtime(){
 const actors=[];
 globalThis.CONST={DOCUMENT_OWNERSHIP_LEVELS:{OWNER:3}};
 globalThis.game={user:{id:'gm',isGM:true},world:{id:'test'},actors:{contents:actors,get:id=>actors.find(row=>row.id===id)}};
 function actor(id,character,link){
  const row={id,isOwner:true,name:character.profile.name,img:'icons/svg/mystery-man.svg',prototypeToken:{texture:{src:'kept.png'}},ownership:{},flags:{character,companion:link},writes:0,
   canUserModify:()=>true,getFlag(_namespace,key){return this.flags[key];},async setFlag(_namespace,key,value){this.writes++;this.flags[key]=structuredClone(value);},async update(){this.writes++;}};
  actors.push(row);return row;
 }
 const parent=actor('parent',snapshot(retinueFixture())),child=actor('child',companionSnapshot(parent.flags.character,0),{sourceActorId:parent.id,key:companionKey(parent.flags.character,0)});
 return {parent,child};
}

test('Linked divine companions retain karma resources in their own snapshot and editor resource list',()=>{
 const raw=retinueFixture();Object.assign(raw.Undead[0],{KarmaEnergy:12,CurrentKarmaEnergy:7});
 const child=companionSnapshot(snapshot(raw),2);
 assert.deepEqual(child.resources.find(row=>row.name==='KE'),{name:'KE',value:7,max:12});
 assert.equal(stateResources(child)[0].resources.find(row=>row.name==='KE').value,7);
});

test('Import comparison shows a companion karma change even when no probe or other energy changes',()=>{
 const raw=retinueFixture();Object.assign(raw.Undead[0],{KarmaEnergy:12,CurrentKarmaEnergy:7});
 const before=snapshot(raw);raw.Undead[0].CurrentKarmaEnergy=3;
 const differences=compareCharacters(before,snapshot(raw)),row=differences.find(row=>row.label==='Wache · Gefolge');
 assert.ok(row);assert.match(row.before,/KE 7\/12/);assert.match(row.after,/KE 3\/12/);
});

test('A retinue library retains only changed creature energies through reorder and resets to its new source',()=>{
 const raw=retinueFixture(),library={Format:'Pedipalpus.Gefolge',Version:1,Name:'Testgefolge',Animals:raw.Animals,Demons:raw.Demons,Undead:raw.Undead};
 const before=snapshot(library),key=memberStateKey(readCompanions(before)[1]);
 assert.equal(stateResources(before).some(row=>row.key==='root'),false);
 const local=withPlayState(before,compactLocalState(before,{version:1,resources:{[key]:{LE:9,AE:22}}}));
 library.Demons[0].CurrentAstralEnergy=17;library.Demons[0].CurrentLe=11;
 library.Demons.unshift({...library.Demons[0],Name:'Neuer Dämon',InventoryId:'new-demon',CurrentLe:19});
 const updated=retainPlayState(local,snapshot(library)),members=readCompanions(updated);
 assert.equal(members.find(row=>row.InventoryId==='demon-1').CurrentLe,9);
 assert.equal(members.find(row=>row.InventoryId==='demon-1').CurrentAstralEnergy,17);
 assert.equal(members.find(row=>row.InventoryId==='new-demon').CurrentLe,19);
 const reset=withPlayState(updated,{version:1});
 assert.equal(readCompanions(reset).find(row=>row.InventoryId==='demon-1').CurrentLe,11);
 assert.equal(reset.localState,undefined);
});

test('Companion import stops if the parent changes during image upload before writing a child',async()=>{
 const {parent,child}=runtime(),plan=prepareCompanionImport(parent.flags.character,parent.id,[{index:0,targetId:child.id}]);
 let uploads=0;
 globalThis.foundry={applications:{apps:{FilePicker:{implementation:{browse:async()=>({dirs:['worlds/test/pedipalpus-portraits'],files:[]}),upload:async()=>{
  uploads++;parent.flags.character={...parent.flags.character,importedAt:'changed-during-upload'};return {path:'worlds/test/pedipalpus-portraits/new.png'};
 }}}}}};
 const portrait={file:new File(['picture'],'portrait.png',{type:'image/png'}),extension:'png'};
 await assert.rejects(applyCompanionImport(parent,plan,{portraits:{[plan[0].key]:portrait}}),/Hauptcharakter wurde inzwischen geändert/);
 assert.ok(uploads>0);assert.equal(child.writes,0);assert.equal(child.img,'icons/svg/mystery-man.svg');
});

test('Companion import checks parent ownership even when the selected child is editable',async()=>{
 const {parent,child}=runtime(),plan=prepareCompanionImport(parent.flags.character,parent.id,[{index:0,targetId:child.id}]);
 parent.isOwner=false;
 await assert.rejects(applyCompanionImport(parent,plan,{includeImages:false}),/Besitzerrechte am Hauptcharakter/);
 assert.equal(child.writes,0);
});

test('A companion image changed during flag updates is preserved rather than replaced by the import',async()=>{
 const {parent,child}=runtime(),plan=prepareCompanionImport(parent.flags.character,parent.id,[{index:0,targetId:child.id}]);
 const setFlag=child.setFlag.bind(child);child.setFlag=async(...args)=>{await setFlag(...args);child.img='newer-portrait.png';};
 globalThis.foundry={applications:{apps:{FilePicker:{implementation:{browse:async()=>({dirs:['worlds/test/pedipalpus-portraits'],files:[]}),upload:async()=>({path:'worlds/test/pedipalpus-portraits/imported.png'})}}}}};
 const portrait={file:new File(['picture'],'portrait.png',{type:'image/png'}),extension:'png'};
 await assert.rejects(applyCompanionImport(parent,plan,{portraits:{[plan[0].key]:portrait}}),/Charakterbild wurde inzwischen geändert/);
 assert.equal(child.img,'newer-portrait.png');
});

test('Companion probes with outer name whitespace bypass the published modifier dialog and preserve identity',async()=>{
 const raw=retinueFixture();raw.Demons[0].Name='  Testdämon  ';raw.Demons[0].MagicalAbilities[0].Name=' Illusion  ';
 const character=snapshot(raw),commands={},hooks={},messages=[];let dialogs=0;
 globalThis.game={user:{isGM:true},users:[],modules:new Map([['ucurifunke-checks',{active:true,version:'1.0.14'}]])};
 globalThis.foundry={applications:{sidebar:{tabs:{ChatLog:{CHAT_COMMANDS:commands}}},api:{DialogV2:{async input(){dialogs++;return null;}}}},
  utils:{isNewerVersion:(a,b)=>a.localeCompare(b,undefined,{numeric:true})>0,escapeHTML:value=>String(value).replace(/[<>]/g,'')},
  dice:{Roll:class{async evaluate(){this.dice=[{faces:20,results:[{result:10},{result:10},{result:10}]}];this.total=30;return this;}}},
  documents:{ChatMessage:{applyMode(data,mode){data.mode=mode;},async create(data){messages.push(data);}}}};
 globalThis.CONST={CHAT_MESSAGE_STYLES:{OTHER:0}};
 globalThis.ui={notifications:{error:message=>assert.fail(message)}};
 const source=fs.readFileSync(new URL('../../pedipalpus-checks/ucurifunke-v1.0.14/scripts/ucurifunke-checks.js',import.meta.url),'utf8');
 vm.runInNewContext(source,{foundry,game,ui,CONST,console:{log(){}},Hooks:{once:(key,fn)=>{hooks[key]=fn;},on(){}}});hooks.init();hooks.ready?.();
 const actor={id:'a',name:'Test',isOwner:true};
 for(const id of ['demons:0:attribute:MU','demons:0:magical:0'])await executeCheck(actor,character.checks.find(row=>row.id===id),null,{modifier:2,blind:true});
 assert.equal(dialogs,0);assert.equal(messages.length,2);assert.ok(messages.every(row=>row.mode==='blind'));
 assert.equal(readCompanions(character)[1].Name,'  Testdämon  ');assert.equal(companionKey(character,1),'id:demon-1');
});
