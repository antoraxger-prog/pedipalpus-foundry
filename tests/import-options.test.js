import {test} from 'node:test';
import assert from 'node:assert/strict';
import {retinueFixture,npcFixture} from './fixture.js';
import {normalizeCharacter,MODULE_ID} from '../scripts/data.js';
import {withCompanionImport,readCompanions,isCompanionCheck,withCompanionAttributes} from '../scripts/retinue.js';
import {withArmorState} from '../scripts/equipment.js';
import {withFocus} from '../scripts/combat.js';
import {ownerAssignment,assignOwner,getCharacter} from '../scripts/storage.js';
import {prepareCompanionImport,verifyCompanionImport,applyCompanionImport,companionSnapshot,companionKey,companionActor,companionImportTargets,companionImportLabel,saveStandaloneCompanion,companionRollIssue} from '../scripts/companions.js';
import {readCharacterWithPortrait} from '../scripts/character-folder.js';
import {readLiveSource} from '../scripts/import-source.js';
import {renderImportOptions,renderView,renderCompanionImportOptions} from '../scripts/view.js';
const snapshot=raw=>({...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)});
function runtime(){
 globalThis.CONST={DOCUMENT_OWNERSHIP_LEVELS:{OWNER:3}};
 const actors=[];globalThis.game={user:{id:'gm',isGM:true},users:[{id:'gm',isGM:true},{id:'player',name:'Spieler'}],actors:{contents:actors,get:id=>actors.find(actor=>actor.id===id)}};
 globalThis.foundry={documents:{Actor:{canUserCreate:()=>true,create:async data=>{const {flags,...extra}=data;return actor(`new-${actors.length}`,flags[MODULE_ID].character,flags[MODULE_ID].companion,extra);}}}};
 function actor(id,character,link,extra={}){const row={id,isOwner:true,name:character?.profile.name??'Leer',img:'icons/svg/mystery-man.svg',prototypeToken:{texture:{src:'kept.webp'}},ownership:{observer:2},flags:{character,companion:link},canUserModify:()=>true,getFlag(_ns,key){return this.flags[key];},async setFlag(_ns,key,value){this.flags[key]=structuredClone(value);},async update(values){for(const [key,value]of Object.entries(values)){const keys=key.replace('flags.'+MODULE_ID+'.','flags.').split('.');let obj=this;for(const name of keys.slice(0,-1))obj=obj[name]??={};obj[keys.at(-1)]=value;}},...extra};actors.push(row);return row;}
 const character=snapshot(retinueFixture()),parent=actor('parent',character),child=(index,id=`child-${index}`)=>actor(id,companionSnapshot(character,index),{sourceActorId:'parent',key:companionKey(character,index)});
 return {actor,parent,child,character};
}
test('Skipping companions preserves existing creatures and choices while keeping the new source and main values',()=>{
 const previous=snapshot(retinueFixture()),raw=retinueFixture();raw.Name='Neu';raw.Animals=[];raw.Demons[0].MU=19;raw.Undead=[];
 const next=snapshot(raw),kept=withCompanionImport(previous,next,false);
 assert.equal(kept.profile.name,'Neu');assert.equal(kept.sourceJSON,next.sourceJSON);assert.deepEqual(readCompanions(kept),readCompanions(previous));assert.deepEqual(kept.checks.filter(isCompanionCheck),previous.checks.filter(isCompanionCheck));
 assert.deepEqual(readCompanions(withFocus(kept,2)),readCompanions(previous));
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
 for(const targetId of ['parent','root','missing'])assert.throws(()=>prepareCompanionImport(character,'parent',[{index:0,targetId}]),/Importziel/);
 assert.equal(prepareCompanionImport(character,'parent',[{index:0,targetId:'foreign'}])[0].targetId,'foreign');
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

test('Existing companions from another import and standalone creatures retain identity, folder, images and rights',async()=>{
 const {parent,child,actor,character}=runtime(),old=child(0),other=actor('other-parent',character),oldParent=JSON.stringify(parent),otherCharacter=JSON.stringify(other.flags.character);
 const standalone=actor('standalone',companionSnapshot(character,1));standalone.folder={name:'Wesen',folder:{name:'Gefolge'}};standalone.img='own.webp';standalone.prototypeToken.width=2;
 old.folder={name:'Skelette'};const plan=prepareCompanionImport(character,other.id,[{index:0,targetId:old.id},{index:1,targetId:standalone.id}]);
 assert.equal(plan[0].previousSource.id,parent.id);assert.equal(companionImportLabel(standalone),'Gefolge / Wesen / Testdämon');
 await applyCompanionImport(other,plan,{includeImages:false});assert.equal(JSON.stringify(parent),oldParent);assert.equal(JSON.stringify(other.flags.character),otherCharacter);
 assert.equal(old.flags.companion.sourceActorId,other.id);assert.equal(old.folder.name,'Skelette');assert.equal(standalone.flags.companion.sourceActorId,other.id);assert.equal(standalone.img,'own.webp');assert.equal(standalone.prototypeToken.texture.src,'kept.webp');assert.equal(standalone.prototypeToken.width,2);assert.deepEqual(standalone.ownership,{observer:2});
 assert.equal(companionActor(other.id,companionKey(character,0)),old);assert.equal(game.actors.contents.length,4);
});

test('Cross-import targets require old-source permission and reject old-source changes before writes',async()=>{
 const {parent,child,actor,character}=runtime(),old=child(0),other=actor('other-parent',character),before=JSON.stringify(old),plan=prepareCompanionImport(character,other.id,[{index:0,targetId:old.id}]);
 parent.flags.character={...character,profile:{...character.profile,name:'Geändert'}};assert.throws(()=>verifyCompanionImport(character,other.id,plan),/inzwischen/);
 await assert.rejects(applyCompanionImport(other,plan,{includeImages:false}),/inzwischen/);assert.equal(JSON.stringify(old),before);
 parent.canUserModify=()=>false;assert.equal(companionImportTargets(other.id).some(row=>row.id===old.id),false);assert.throws(()=>prepareCompanionImport(character,other.id,[{index:0,targetId:old.id}]),/Importziel/);
 parent.canUserModify=()=>true;const next=prepareCompanionImport(character,other.id,[{index:0,targetId:old.id}]);game.actors.contents.splice(game.actors.contents.indexOf(parent),1);assert.throws(()=>verifyCompanionImport(character,other.id,next),/inzwischen/);
});

test('Directory targets protect primary characters, NPCs, nested roots, duplicate targets and escaped folder labels',()=>{
 const {parent,child,actor,character}=runtime();child(0);const creature=actor('creature',companionSnapshot(character,1)),npc=actor('npc',snapshot(npcFixture())),root=actor('root',companionSnapshot(character,2));actor('nested',companionSnapshot(character,0),{sourceActorId:root.id,key:'nested'});
 creature.folder={name:'<img src=x>',folder:null};const other=actor('same-name',companionSnapshot(character,1));other.folder=creature.folder;
 const targets=companionImportTargets(null).map(row=>row.id);assert.ok(targets.includes(creature.id));for(const id of [parent.id,npc.id,root.id])assert.equal(targets.includes(id),false);
 const html=renderCompanionImportOptions(character,null);assert.doesNotMatch(html,/<img src=x>/);assert.match(html,/&lt;img src=x&gt;/);assert.match(html,/creature/);assert.match(html,/same-name/);
 assert.throws(()=>prepareCompanionImport(character,null,[{index:0,targetId:creature.id},{index:1,targetId:creature.id}]),/denselben/);
});

test('A single-creature import can reuse a linked directory figure as its own root without a duplicate or old-parent edits',async()=>{
 const {parent,child,character}=runtime(),target=child(0),parentBefore=JSON.stringify(parent),raw={Format:'Pedipalpus.Gefolge',Version:1,Name:'Neue Wache',Undead:retinueFixture().Undead},single=snapshot(raw);target.folder={name:'Gefolge'};target.img='own.webp';const before=JSON.stringify(target),plan=prepareCompanionImport(single,null,[{index:0,targetId:target.id}]);
 await assert.rejects(saveStandaloneCompanion(character,target.id,plan),/einzelnes Wesen/);assert.equal(JSON.stringify(target),before);
 await saveStandaloneCompanion(single,target.id,plan,null,{ownerId:'player'});assert.equal(game.actors.contents.length,2);assert.equal(JSON.stringify(parent),parentBefore);assert.equal(target.folder.name,'Gefolge');assert.equal(target.img,'own.webp');assert.equal(target.prototypeToken.texture.src,'kept.webp');assert.deepEqual(target.ownership,{observer:2,player:3});assert.equal(target.flags.companion.sourceActorId,null);assert.equal(getCharacter(target).profile.retinueOnly,true);assert.equal(companionRollIssue(target),'');assert.equal(companionActor(parent.id,companionKey(character,0)),undefined);
});

test('Removing the main import actor prevents companion creation and keeps old linked actors untouched',async()=>{
 const {parent,child,character}=runtime(),old=child(0),before=structuredClone(old.flags),plan=prepareCompanionImport(character,parent.id,[{index:0,targetId:'new'}]);
 game.actors.contents.splice(game.actors.contents.indexOf(parent),1);
 await assert.rejects(applyCompanionImport(parent,plan,{includeImages:false}),/Importfigur.*entfernt/);
 assert.equal(game.actors.contents.length,1);assert.equal(game.actors.contents[0],old);assert.deepEqual(old.flags,before);
});
test('Talent headers share actual parent identity; all companions render as closed native disclosures',()=>{
 const raw=retinueFixture();raw.AcademicSkills[0].Subskills.push({Name:'Geschichte',TotalValue:5},{Name:'Götterkunde',TotalValue:6});const character=snapshot(raw);
 const full=renderView({actor:{isOwner:true},character,status:{ready:true}}),battle=renderView({actor:{isOwner:true},character,status:{ready:true},mode:'battle'});
 assert.match(full,/pp-talent-header/);assert.equal((full.match(/pp-talent-child/g)??[]).length,3);assert.match(full,/Basis 4/);assert.equal((battle.match(/<details class="pp-companion-section"/g)??[]).length,3);assert.doesNotMatch(battle,/<details class="pp-companion-section"[^>]*\bopen\b/);assert.match(battle,/data-check-id="animals:0:0:attack"/);
});
