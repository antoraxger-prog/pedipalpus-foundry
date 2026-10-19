import {test} from 'node:test';
import assert from 'node:assert/strict';
import {retinueFixture,npcFixture} from './fixture.js';
import {normalizeCharacter,MODULE_ID} from '../scripts/data.js';
import {withCompanionImport,readCompanions,isCompanionCheck,withCompanionAttributes} from '../scripts/retinue.js';
import {withArmorState} from '../scripts/equipment.js';
import {withFocus} from '../scripts/combat.js';
import {ownerAssignment,assignOwner,getCharacter} from '../scripts/storage.js';
import {prepareCompanionImport,verifyCompanionImport,applyCompanionImport,companionSnapshot,companionKey,companionActor} from '../scripts/companions.js';
import {readCharacterWithPortrait} from '../scripts/character-folder.js';
import {readLiveSource} from '../scripts/import-source.js';
import {renderImportOptions,renderView} from '../scripts/view.js';
const snapshot=raw=>({...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)});
function runtime(){
 globalThis.CONST={DOCUMENT_OWNERSHIP_LEVELS:{OWNER:3}};
 const actors=[];globalThis.game={user:{id:'gm',isGM:true},users:[{id:'gm',isGM:true},{id:'player',name:'Spieler'}],actors:{contents:actors,get:id=>actors.find(actor=>actor.id===id)}};
 globalThis.foundry={documents:{Actor:{canUserCreate:()=>true,create:async data=>{const {flags,...extra}=data;return actor(`new-${actors.length}`,flags[MODULE_ID].character,flags[MODULE_ID].companion,extra);}}}};
 function actor(id,character,link,extra={}){const row={id,isOwner:true,name:character?.profile.name??'Leer',img:'icons/svg/mystery-man.svg',prototypeToken:{texture:{src:'kept.webp'}},ownership:{observer:2},flags:{character,companion:link},canUserModify:()=>true,getFlag(_ns,key){return this.flags[key];},async setFlag(_ns,key,value){this.flags[key]=structuredClone(value);},async update(values){for(const [key,value]of Object.entries(values)){const keys=key.split('.');let obj=this;for(const name of keys.slice(0,-1))obj=obj[name]??={};obj[keys.at(-1)]=value;}},...extra};actors.push(row);return row;}
 const character=snapshot(retinueFixture()),parent=actor('parent',character),child=(index,id=`child-${index}`)=>actor(id,companionSnapshot(character,index),{sourceActorId:'parent',key:companionKey(character,index)});
 return {actor,parent,child,character};
}
test('Skipping companions preserves existing creatures and choices while keeping the new source and main values',()=>{
 const previous=snapshot(retinueFixture()),raw=retinueFixture();raw.Name='Neu';raw.Animals=[];raw.Demons[0].MU=19;raw.Undead=[];
 const next=snapshot(raw),kept=withCompanionImport(previous,next,false);
 assert.equal(kept.profile.name,'Neu');assert.equal(kept.sourceJSON,next.sourceJSON);assert.deepEqual(readCompanions(kept),readCompanions(previous));assert.deepEqual(kept.checks.filter(isCompanionCheck),previous.checks.filter(isCompanionCheck));
 assert.deepEqual(readCompanions(withFocus(kept,3)),readCompanions(previous));
 const selected=withCompanionAttributes(kept,'demons:0:mundane:0',['MU','KL','IN']);assert.equal(JSON.parse(selected.sourceJSON).Demons[0].MundaneAbilities[0].FirstAttribute,undefined);
 assert.equal(withCompanionImport(null,next,false).checks.some(isCompanionCheck),false);assert.deepEqual(readCompanions(withCompanionImport(null,next,false)),[]);
 assert.deepEqual(readCompanions(withCompanionImport(kept,next,true)),readCompanions(next));
});
test('Armor recalculation cannot resurrect skipped companions in either source format',()=>{
 for(const raw of [retinueFixture(),npcFixture()]){
  if(!raw.Format){raw.Armors=[{Name:'Helm',Protection:1,MobilityPenalty:0,BaseMobilityPenalty:0,Weight:0,OnPerson:true,IsEquiped:false}];raw.DerivedValues=Array.from({length:9},(_,i)=>({LongName:'Wert',TotalValue:i===8?30:0}));}
  const noCompanions=withCompanionImport(null,snapshot(raw),false),next=withArmorState(noCompanions,'Armors:0','equipped',true);
  assert.deepEqual(readCompanions(next),[]);assert.equal(next.checks.some(isCompanionCheck),false);assert.equal(next.retinueImportEnabled,false);
 }
});
test('Image opt-out avoids even looking up optional portrait handles and ignores selected invalid images',async()=>{
 const raw=retinueFixture();raw.PortraitFileName='missing.png';const file=new File([JSON.stringify(raw)],'char.json');
 const value=await readCharacterWithPortrait(file,[new File(['broken'],'missing.png')],{includePortrait:false});assert.equal(value.portrait,null);
 const live=await readLiveSource({fileHandle:{getFile:async()=>file},directoryHandle:{queryPermission(){assert.fail('Optional picture permission requested');}}},{includePortrait:false});assert.equal(live.portrait,null);
});
test('Only GM can grant an existing player ownership; other rights remain intact',async()=>{
 const {parent}=runtime();await assignOwner(parent,'player');assert.deepEqual(parent.ownership,{observer:2,player:3});
 assert.throws(()=>ownerAssignment('__proto__'),/Spieler/);game.user.isGM=false;assert.throws(()=>ownerAssignment('player'),/Spielleiter/);assert.deepEqual(ownerAssignment(''),{});
 assert.doesNotMatch(renderImportOptions([],null,true),/name="ownerId"/);game.user.isGM=true;assert.match(renderImportOptions([],null,true),/name="ownerId"/);
});
test('Companion plans reject wrong targets, duplicate targets, missing permission and concurrent changes before writes',()=>{
 const {parent,child,actor,character}=runtime(),first=child(0),second=child(1),empty=actor('empty',null);actor('root',character);actor('foreign',companionSnapshot(character,0),{sourceActorId:'other',key:'x'});
 for(const targetId of ['parent','root','foreign','missing'])assert.throws(()=>prepareCompanionImport(character,'parent',[{index:0,targetId}]),/Importziel/);
 assert.throws(()=>prepareCompanionImport(character,'parent',[{index:0,targetId:'empty'},{index:1,targetId:'empty'}]),/denselben/);
 assert.throws(()=>prepareCompanionImport(character,'parent',[{index:0,targetId:second.id},{index:1,targetId:'new'}]),/zugleich/);
 const plan=prepareCompanionImport(character,'parent',[{index:0,targetId:first.id}]);empty.name='Geändert';verifyCompanionImport(character,'parent',plan);first.name='Geändert';assert.throws(()=>verifyCompanionImport(character,'parent',plan),/inzwischen/);
 first.canUserModify=()=>false;assert.throws(()=>prepareCompanionImport(character,'parent',[{index:0,targetId:'new'}]),/Bearbeitungsrechte/);assert.equal(parent.flags.character,character);
});
test('New companion entry retires its old link without deleting the old actor and assigns only chosen actors',async()=>{
 const {parent,child,character}=runtime(),old=child(0),unchanged=child(1);old.img='kept.webp';const original=structuredClone(unchanged.flags),plan=prepareCompanionImport(character,parent.id,[{index:0,targetId:'new'}]);
 await applyCompanionImport(parent,plan,{includeImages:false,ownerId:'player'});
 const fresh=companionActor(parent.id,companionKey(character,0));assert.notEqual(fresh.id,old.id);assert.equal(old.flags.companion.active,false);assert.equal(old.img,'kept.webp');assert.equal(old.flags.companion.replacedBy,fresh.id);assert.deepEqual(unchanged.flags,original);assert.equal(fresh.ownership.player,3);assert.equal(getCharacter(fresh).profile.name,'Skelett');assert.equal(fresh.img,'icons/svg/mystery-man.svg');
});
test('Updating an existing companion or empty actor keeps actor identity and art when images are off',async()=>{
 const {parent,child,actor,character}=runtime(),first=child(0),empty=actor('empty',null);first.img='first.webp';empty.img='empty.webp';
 const plan=prepareCompanionImport(character,parent.id,[{index:0,targetId:first.id},{index:1,targetId:empty.id}]);
 await applyCompanionImport(parent,plan,{includeImages:false});assert.equal(first.img,'first.webp');assert.equal(empty.img,'empty.webp');assert.equal(empty.prototypeToken.texture.src,'kept.webp');assert.equal(empty.flags.companion.key,companionKey(character,1));
});
test('Talent headers share actual parent identity; all companions render as closed native disclosures',()=>{
 const raw=retinueFixture();raw.AcademicSkills[0].Subskills.push({Name:'Geschichte',TotalValue:5},{Name:'Götterkunde',TotalValue:6});const character=snapshot(raw);
 const full=renderView({actor:{isOwner:true},character,status:{ready:true}}),battle=renderView({actor:{isOwner:true},character,status:{ready:true},mode:'battle'});
 assert.match(full,/pp-talent-header/);assert.equal((full.match(/pp-talent-child/g)??[]).length,3);assert.match(full,/Basis 4/);assert.equal((battle.match(/<details class="pp-companion-section"/g)??[]).length,3);assert.doesNotMatch(battle,/<details class="pp-companion-section"[^>]*\bopen\b/);assert.match(battle,/data-check-id="animals:0:0:attack"/);
});
