import { MODULE_ID, FLAG, SCHEMA_VERSION, validSnapshot } from './data.js';
import { getCharacter,ownerAssignment,assignOwner } from './storage.js';
import { uploadPortrait,applyPortrait,framingFor,portraitState } from './portraits.js';
import { tokenFromActor } from './tokens.js';
import { readCompanions,memberAttributes,isCompanionCheck,retainCompanionChoices } from './retinue.js';

export const companionEntries=readCompanions;
export function companionKey(character,index){
 const members=companionEntries(character),member=members[index];if(!member)throw new Error('Dieses Gefolgsmitglied ist im aktuellen Charakter nicht mehr vorhanden.');
 const clean=value=>String(value??'').normalize('NFC').trim(),name=clean(member.Name),species=clean(member.Species),id=clean(member.InventoryId);
 const legacy=JSON.stringify([name.toLocaleLowerCase('de'),species.toLocaleLowerCase('de')]);
 const key=id?`id:${id}`:member._group==='animals'?legacy:`${member._group}:${legacy}`;
 const duplicates=members.filter(item=>id?clean(item.InventoryId)===id:!item.InventoryId&&item._group===member._group&&clean(item.Name).toLocaleLowerCase('de')===name.toLocaleLowerCase('de')&&clean(item.Species).toLocaleLowerCase('de')===species.toLocaleLowerCase('de'));
 if(!name||duplicates.length!==1)throw new Error('Dieses Gefolgsmitglied ist nicht eindeutig zugeordnet. Bitte in Pedipalpus eindeutige Namen speichern.');
 return key;
}
const linkedActors=(sourceActorId,key)=>game.actors.contents.filter(actor=>{const link=actor.getFlag(MODULE_ID,'companion');return link?.active!==false&&link?.sourceActorId===sourceActorId&&link.key===key;});
export function companionActor(sourceActorId,key){const matches=linkedActors(sourceActorId,key);if(matches.length>1)throw new Error('Mehrere Token-Einträge sind diesem Begleiter zugeordnet. Bitte beim Import ein eindeutiges Ziel wählen.');return matches[0];}
export function companionRollIssue(actor){
 const link=actor?.getFlag?.(MODULE_ID,'companion');if(!link?.sourceActorId)return '';
 if(link.active===false)return 'Dieser Begleiter wurde ersetzt. Bitte den aktuellen Begleiter öffnen.';
 const source=game.actors?.get?.(link.sourceActorId),character=getCharacter(source);
 if(!source||!character)return 'Der Hauptcharakter dieses Begleiters ist nicht mehr vorhanden.';
 if(game.actors.get(actor.id)!==actor||source.getFlag(MODULE_ID,'companion')?.sourceActorId)return 'Dieser Begleiter ist dem Hauptcharakter nicht mehr eindeutig zugeordnet. Bitte den Import prüfen.';
 const matches=companionEntries(character).filter((_member,index)=>{try{return companionKey(character,index)===link.key;}catch{return false;}});
 return matches.length===1?'':'Dieser Begleiter ist dem Hauptcharakter nicht mehr eindeutig zugeordnet. Bitte den Import prüfen.';
}
export function companionSnapshot(character,index){
 const member=companionEntries(character)[index];companionKey(character,index);
 const item=(character.equipment??[]).find(item=>item.id===`${member._collection}:${member._index}`);
 const prefix=`${member._group}:${member._index}:`;
 const checks=(character.checks??[]).filter(check=>isCompanionCheck(check)&&check.id.startsWith(prefix)).map(check=>({...check,id:check.id.replace(prefix,`${member._group}:0:`),companionIndex:0}));
 return {schemaVersion:SCHEMA_VERSION,combatSchemaVersion:1,retinueSchemaVersion:1,retinue:[{...member,_index:0}],sourceVersion:character.sourceVersion,...(character.sourceFormat?{sourceFormat:character.sourceFormat}:{}),importedAt:character.importedAt,profile:{name:String(member.Name),portraitFileName:'',race:String(member.Domain??member.Species??''),companionGroup:member._group},attributes:memberAttributes(member),checks,equipment:item?[{...item,id:`${member._collection}:0`}]:[],resources:[{name:'LE',value:member.CurrentLe??null,max:member.MaxLe??null},{name:'AE',value:member.CurrentAstralEnergy??null,max:member.AstralEnergy??null},{name:'KE',value:member.CurrentKarmaEnergy??null,max:member.KarmaEnergy??null}],derived:[],details:[],warnings:[],secondary:[],conditions:{simple:[],complex:[]},combat:{stats:[],melee:[],ranged:[]}};
}
export async function saveCompanion(source,index,expectedKey,portrait,warn,expectedTarget){
 if(!source?.isOwner||!source.canUserModify(game.user,'update'))throw new Error('Zum Anlegen eines Gefolge-Tokens werden Besitzerrechte benötigt.');
 const character=getCharacter(source),key=companionKey(character,index);if(key!==expectedKey)throw new Error('Das Gefolgsmitglied wurde inzwischen geändert. Bitte erneut auswählen.');
 const previousLink=source.getFlag(MODULE_ID,'companion'),snapshot=companionSnapshot(character,index),existing=previousLink?.sourceActorId?source:companionActor(source.id,key);
 if(existing&&!existing.canUserModify(game.user,'update'))throw new Error('Für diesen Gefolge-Charakter fehlen Bearbeitungsrechte.');
 if(!existing&&!foundry.documents.Actor.canUserCreate(game.user))throw new Error('Dein Spielleiter muss den Gefolge-Charakter anlegen oder dir die Berechtigung dafür geben.');
 const before=targetState(existing),expectedPortrait=existing?portraitState(existing):null,sourceState=JSON.stringify(character),sourceLinkState=JSON.stringify(previousLink);
 const verify=()=>{
  if(game.actors.get(source.id)!==source)throw new Error('Die Figur wurde inzwischen entfernt oder ersetzt. Bitte erneut auswählen.');
  if(JSON.stringify(source.getFlag(MODULE_ID,'companion'))!==sourceLinkState)throw new Error('Das Gefolgsbild oder seine Zuordnung wurde inzwischen geändert. Bitte erneut öffnen.');
  const current=getCharacter(source),target=previousLink?.sourceActorId?source:companionActor(source.id,key);
  if(!source.isOwner||!source.canUserModify(game.user,'update')||target&&!target.canUserModify(game.user,'update')||companionKey(current,index)!==key||JSON.stringify(current)!==sourceState||target!==existing||targetState(target)!==before||expectedTarget&&(target?.id!==expectedTarget.id||before!==expectedTarget.state||sourceState!==expectedTarget.source))throw new Error('Das Gefolgsbild oder seine Zuordnung wurde inzwischen geändert. Bitte erneut öffnen.');
  if(!existing&&!foundry.documents.Actor.canUserCreate(game.user))throw new Error('Dein Spielleiter muss den Gefolge-Charakter anlegen oder dir die Berechtigung dafür geben.');
 };
 verify();const image=await uploadPortrait(portrait),token=await uploadPortrait(portrait.token??portrait);verify();const link={...(previousLink?.sourceActorId?previousLink:{sourceActorId:source.id,key}),tokenStyle:portrait.tokenStyle};
 if(existing){await existing.setFlag(MODULE_ID,FLAG,retainCompanionChoices(getCharacter(existing),snapshot));await existing.setFlag(MODULE_ID,'companion',link);await applyPortrait(existing,image,warn,token,framingFor(portrait),expectedPortrait);return existing;}
 return foundry.documents.Actor.create({name:snapshot.profile.name,type:'character',img:image,ownership:{...source.ownership,[game.user.id]:CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER},prototypeToken:{name:snapshot.profile.name,actorLink:true,texture:{src:token}},flags:{[MODULE_ID]:{[FLAG]:snapshot,companion:link,...(framingFor(portrait)?{portraitFraming:framingFor(portrait)}:{})}}});
}
export async function refreshCompanions(source,warn=message=>ui.notifications.warn(message),{skipKeys=[],localState=false}={}){
 const result={updated:0,failed:0,stopped:false},character=getCharacter(source);if(!character||source.getFlag(MODULE_ID,'companion')?.sourceActorId)return result;
 if(character.retinueImportEnabled===false&&!localState)return result;
 const expected=JSON.stringify(character),registered=typeof game.actors.get==='function';
 const current=()=>source.isOwner&&source.canUserModify(game.user,'update')&&(!registered||game.actors.get(source.id)===source)&&!source.getFlag(MODULE_ID,'companion')?.sourceActorId&&JSON.stringify(getCharacter(source))===expected;
 const keys=companionEntries(character).map((_member,index)=>{try{return companionKey(character,index);}catch{return null;}});
 for(const actor of [...game.actors.contents]){
  const link=actor.getFlag(MODULE_ID,'companion');if(link?.sourceActorId!==source.id||link.active===false||skipKeys.includes(link.key))continue;
  if(!current()){result.stopped=true;warn('Der Hauptcharakter wurde inzwischen geändert, entfernt oder ist nicht mehr bearbeitbar. Weitere Begleiterwerte wurden nicht übernommen. Bitte den aktuellen Spielstand erneut öffnen und speichern.');break;}
  if(registered&&game.actors.get(actor.id)!==actor)continue;
  if(!actor.canUserModify(game.user,'update')){result.failed++;warn(`${actor.name}: Gefolgewerte konnten wegen fehlender Bearbeitungsrechte nicht aktualisiert werden.`);continue;}
  const index=keys.indexOf(link.key),previous=getCharacter(actor);
  try{
   if(index<0){if(previous){await actor.setFlag(MODULE_ID,FLAG,{...previous,checks:[],warnings:['Dieses Gefolgsmitglied ist im aktuellen Import nicht eindeutig enthalten.']});result.updated++;}continue;}
   await actor.setFlag(MODULE_ID,FLAG,retainCompanionChoices(previous,companionSnapshot(character,index)));result.updated++;
  }catch(error){console.warn(MODULE_ID,error);result.failed++;warn(`${actor.name}: Die gespeicherten Begleiterwerte konnten nicht übertragen werden. Bitte den Spielstand erneut öffnen und speichern, um es erneut zu versuchen.`);}
 }
 return result;
}

export function companionImportTargets(sourceActorId){
 return game.actors.contents.filter(actor=>{
  if(actor.id===sourceActorId||!actor.canUserModify(game.user,'update'))return false;
  if(game.actors.contents.some(other=>other.getFlag(MODULE_ID,'companion')?.sourceActorId===actor.id))return false;
  const link=actor.getFlag(MODULE_ID,'companion');
  if(link?.sourceActorId){const previous=game.actors.get(link.sourceActorId);return link.sourceActorId===sourceActorId||!previous||previous.canUserModify(game.user,'update');}
  const character=getCharacter(actor);
  return !character||Boolean(character.profile.companionGroup&&companionEntries(character).length===1&&character.checks.every(isCompanionCheck));
 }).sort((a,b)=>companionImportLabel(a).localeCompare(companionImportLabel(b),'de')||a.id.localeCompare(b.id));
}
export function companionImportLabel(actor){
 const path=[],seen=new Set();let folder=actor.folder;
 while(folder&&path.length<32&&!seen.has(folder)){seen.add(folder);path.unshift(String(folder.name??''));folder=folder.folder;}
 return [...path.filter(Boolean),actor.name||'Ohne Namen'].join(' / ');
}
export const companionTargetState=actor=>JSON.stringify({character:getCharacter(actor),link:actor?.getFlag(MODULE_ID,'companion'),name:actor?.name,img:actor?.img,token:actor?.prototypeToken?.texture?.src,ownership:actor?.ownership,framing:actor?.getFlag(MODULE_ID,'portraitFraming')});
const targetState=companionTargetState;
export function prepareCompanionImport(character,sourceActorId,selections=[]){
 const used=new Set(),indexes=new Set(),targets=companionImportTargets(sourceActorId);
 const plan=selections.filter(row=>row.targetId).map(row=>{
  if(!Number.isSafeInteger(row.index)||indexes.has(row.index))throw new Error('Die Begleiterauswahl ist ungültig.');indexes.add(row.index);
  const key=companionKey(character,row.index),active=sourceActorId?linkedActors(sourceActorId,key):[];
  if(active.some(actor=>!actor.canUserModify(game.user,'update')))throw new Error('Für einen bisherigen Begleiter fehlen Bearbeitungsrechte.');
  if(row.targetId==='new'){
   if(!foundry.documents.Actor.canUserCreate(game.user))throw new Error('Du darfst keine neuen Begleiter-Einträge anlegen.');
  }else{
   if(used.has(row.targetId))throw new Error('Zwei Begleiter dürfen nicht denselben Token-Eintrag überschreiben.');used.add(row.targetId);
   if(!targets.some(actor=>actor.id===row.targetId))throw new Error('Dieses Importziel ist kein bearbeitbarer Begleiter oder leerer Foundry-Eintrag. Hauptcharaktere, NSC und Figuren mit eigenen Begleitern bleiben geschützt.');
  }
  const target=game.actors.get(row.targetId);
  const previous=game.actors.get(target?.getFlag(MODULE_ID,'companion')?.sourceActorId);
  return {index:row.index,key,targetId:row.targetId,expected:target?targetState(target):null,active:active.map(actor=>({id:actor.id,expected:targetState(actor)})),...(previous&&previous.id!==sourceActorId?{previousSource:{id:previous.id,expected:targetState(previous)}}:{})};
 });
 for(const row of plan){const link=game.actors.get(row.targetId)?.getFlag(MODULE_ID,'companion');if(link?.key!==row.key&&plan.some(other=>other.key===link?.key))throw new Error('Ein bisheriger Begleiter ist zugleich Importziel und selbst zur Aktualisierung ausgewählt. Bitte getrennte Ziele wählen.');}
 return plan;
}
export function verifyCompanionImport(character,sourceActorId,plan=[]){
 const fresh=prepareCompanionImport(character,sourceActorId,plan);
 if(JSON.stringify(fresh)!==JSON.stringify(plan))throw new Error('Ein Begleiter oder seine Zuordnung wurde inzwischen geändert. Bitte den Import erneut öffnen.');
}
export async function applyCompanionImport(source,plan=[],{includeImages=true,ownerId='',tokenFrame='concrete',portraits={},warn=message=>ui.notifications.warn(message)}={}){
 ownerAssignment(ownerId);
 const character=getCharacter(source),sourceState=JSON.stringify(character);
 const verify=selection=>{
  if(game.actors.get(source?.id)!==source)throw new Error('Die Importfigur wurde inzwischen entfernt oder ersetzt. Bitte erneut auswählen.');
  if(!source?.isOwner||!source.canUserModify(game.user,'update'))throw new Error('Zum Importieren von Begleitern werden Besitzerrechte am Hauptcharakter benötigt.');
  if(JSON.stringify(getCharacter(source))!==sourceState)throw new Error('Der Hauptcharakter wurde inzwischen geändert. Bitte den Import erneut öffnen.');
  verifyCompanionImport(character,source.id,selection);
 };
 verify(plan);
 for(const row of plan){
  verify([row]);
  const snapshot=companionSnapshot(character,row.index),existing=game.actors.get(row.targetId),expectedPortrait=existing?portraitState(existing):null,old=row.active.map(item=>game.actors.get(item.id));
  let portrait=includeImages?portraits[row.key]??null:null;
  const imageSource=old.find(actor=>actor.img&&!actor.img.endsWith('mystery-man.svg'));
  if(!portrait&&includeImages&&imageSource&&imageSource.id!==existing?.id)portrait=await tokenFromActor(imageSource,tokenFrame);
  verify([row]);
  const image=portrait?await uploadPortrait(portrait):null,token=portrait?await uploadPortrait(portrait.token??portrait):null;
  verify([row]);
  const link={sourceActorId:source.id,key:row.key,active:true,tokenStyle:portrait?.tokenStyle??existing?.getFlag(MODULE_ID,'companion')?.tokenStyle??tokenFrame};
  let actor=existing;
  if(actor){
   await actor.setFlag(MODULE_ID,FLAG,retainCompanionChoices(getCharacter(actor),snapshot));await actor.setFlag(MODULE_ID,'companion',link);
   await actor.update({name:snapshot.profile.name,'prototypeToken.name':snapshot.profile.name});
   if(image)await applyPortrait(actor,image,warn,token,framingFor(portrait),expectedPortrait);await assignOwner(actor,ownerId);
  }else actor=await foundry.documents.Actor.create({name:snapshot.profile.name,type:'character',img:image||'icons/svg/mystery-man.svg',ownership:{...source.ownership,[game.user.id]:CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,...ownerAssignment(ownerId)},prototypeToken:{name:snapshot.profile.name,actorLink:true,...(token?{texture:{src:token}}:{})},flags:{[MODULE_ID]:{[FLAG]:snapshot,companion:link,...(framingFor(portrait)?{portraitFraming:framingFor(portrait)}:{})}}});
  for(const previous of old)if(previous.id!==actor.id)await previous.setFlag(MODULE_ID,'companion',{...previous.getFlag(MODULE_ID,'companion'),active:false,replacedBy:actor.id});
 }
 const keys=companionEntries(character).flatMap((_member,index)=>{try{return [companionKey(character,index)];}catch{return [];}});
 await refreshCompanions(source,warn,{skipKeys:keys});
}

export async function saveStandaloneCompanion(snapshot,actorId,plan,portrait=null,{ownerId='',warn}={}){
 if(!validSnapshot(snapshot)||!snapshot.profile.retinueOnly||!snapshot.profile.companionGroup||companionEntries(snapshot).length!==1||plan?.length!==1||plan[0].index!==0||plan[0].targetId!==actorId)throw new Error('Bitte ein einzelnes Wesen und eine vorhandene Begleiterfigur auswählen.');
 const actor=game.actors.get(actorId),expectedPortrait=portraitState(actor),ownership=ownerAssignment(ownerId);
 const verify=()=>{if(game.actors.get(actorId)!==actor||!actor?.canUserModify(game.user,'update'))throw new Error('Die gewählte Begleiterfigur wurde entfernt oder ist nicht mehr bearbeitbar.');verifyCompanionImport(snapshot,null,plan);ownerAssignment(ownerId);};
 verify();const image=portrait?await uploadPortrait(portrait):null,token=portrait?await uploadPortrait(portrait.token??portrait):null;verify();
 await actor.update({name:snapshot.profile.name,'prototypeToken.name':snapshot.profile.name,[`flags.${MODULE_ID}.${FLAG}`]:snapshot,[`flags.${MODULE_ID}.companion`]:{...actor.getFlag(MODULE_ID,'companion'),sourceActorId:null,key:null,active:false,replacedBy:null},...Object.fromEntries(Object.entries(ownership).map(([id,level])=>[`ownership.${id}`,level]))});
 if(image)await applyPortrait(actor,image,warn,token,framingFor(portrait),expectedPortrait);
 return actor;
}
