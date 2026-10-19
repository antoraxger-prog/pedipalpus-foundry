import { MODULE_ID, FLAG, SCHEMA_VERSION } from './data.js';
import { getCharacter,ownerAssignment,assignOwner } from './storage.js';
import { uploadPortrait,applyPortrait } from './portraits.js';
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
export function companionSnapshot(character,index){
 const member=companionEntries(character)[index];companionKey(character,index);
 const item=(character.equipment??[]).find(item=>item.id===`${member._collection}:${member._index}`);
 const prefix=`${member._group}:${member._index}:`;
 const checks=(character.checks??[]).filter(check=>isCompanionCheck(check)&&check.id.startsWith(prefix)).map(check=>({...check,id:check.id.replace(prefix,`${member._group}:0:`),companionIndex:0}));
 return {schemaVersion:SCHEMA_VERSION,combatSchemaVersion:1,retinueSchemaVersion:1,retinue:[{...member,_index:0}],sourceVersion:character.sourceVersion,...(character.sourceFormat?{sourceFormat:character.sourceFormat}:{}),importedAt:character.importedAt,profile:{name:String(member.Name),portraitFileName:'',race:String(member.Domain??member.Species??''),companionGroup:member._group},attributes:memberAttributes(member),checks,equipment:item?[{...item,id:`${member._collection}:0`}]:[],resources:[{name:'LE',value:member.CurrentLe??null,max:member.MaxLe??null},{name:'AE',value:member.CurrentAstralEnergy??null,max:member.AstralEnergy??null}],derived:[],details:[],warnings:[],secondary:[],conditions:{simple:[],complex:[]},combat:{stats:[],melee:[],ranged:[]}};
}
export async function saveCompanion(source,index,expectedKey,portrait,warn){
 if(!source?.isOwner||!source.canUserModify(game.user,'update'))throw new Error('Zum Anlegen eines Gefolge-Tokens werden Besitzerrechte benötigt.');
 const character=getCharacter(source),key=companionKey(character,index);if(key!==expectedKey)throw new Error('Das Gefolgsmitglied wurde inzwischen geändert. Bitte erneut auswählen.');
 const previousLink=source.getFlag(MODULE_ID,'companion'),snapshot=companionSnapshot(character,index),existing=previousLink?.sourceActorId?source:companionActor(source.id,key);
 if(existing&&!existing.canUserModify(game.user,'update'))throw new Error('Für diesen Gefolge-Charakter fehlen Bearbeitungsrechte.');
 if(!existing&&!foundry.documents.Actor.canUserCreate(game.user))throw new Error('Dein Spielleiter muss den Gefolge-Charakter anlegen oder dir die Berechtigung dafür geben.');
 const image=await uploadPortrait(portrait),token=await uploadPortrait(portrait.token??portrait),link={...(previousLink?.sourceActorId?previousLink:{sourceActorId:source.id,key}),tokenStyle:portrait.tokenStyle};
 if(existing){await existing.setFlag(MODULE_ID,FLAG,retainCompanionChoices(getCharacter(existing),snapshot));await existing.setFlag(MODULE_ID,'companion',link);await applyPortrait(existing,image,warn,token);return existing;}
 return foundry.documents.Actor.create({name:snapshot.profile.name,type:'character',img:image,ownership:{...source.ownership,[game.user.id]:CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER},prototypeToken:{name:snapshot.profile.name,actorLink:true,texture:{src:token}},flags:{[MODULE_ID]:{[FLAG]:snapshot,companion:link}}});
}
export async function refreshCompanions(source,warn=message=>ui.notifications.warn(message),{skipKeys=[]}={}){
 const character=getCharacter(source);if(!character||source.getFlag(MODULE_ID,'companion')?.sourceActorId)return;
 if(character.retinueImportEnabled===false)return;
 const keys=companionEntries(character).map((_member,index)=>{try{return companionKey(character,index);}catch{return null;}});
 for(const actor of game.actors.contents){
  const link=actor.getFlag(MODULE_ID,'companion');if(link?.sourceActorId!==source.id||link.active===false||skipKeys.includes(link.key))continue;
  if(!actor.canUserModify(game.user,'update')){warn(`${actor.name}: Gefolgewerte konnten wegen fehlender Bearbeitungsrechte nicht aktualisiert werden.`);continue;}
  const index=keys.indexOf(link.key),previous=getCharacter(actor);
  if(index<0){if(previous)await actor.setFlag(MODULE_ID,FLAG,{...previous,checks:[],warnings:['Dieses Gefolgsmitglied ist im aktuellen Import nicht eindeutig enthalten.']});continue;}
  await actor.setFlag(MODULE_ID,FLAG,retainCompanionChoices(previous,companionSnapshot(character,index)));
 }
}

export function companionImportTargets(sourceActorId){
 return game.actors.contents.filter(actor=>{
  if(actor.id===sourceActorId||!actor.canUserModify(game.user,'update'))return false;
  const link=actor.getFlag(MODULE_ID,'companion');
  return link?.sourceActorId?link.sourceActorId===sourceActorId:!getCharacter(actor);
 });
}
const targetState=actor=>JSON.stringify({character:getCharacter(actor),link:actor.getFlag(MODULE_ID,'companion'),name:actor.name,img:actor.img,token:actor.prototypeToken?.texture?.src,ownership:actor.ownership});
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
   if(!targets.some(actor=>actor.id===row.targetId))throw new Error('Dieses Importziel ist kein eigener Begleiter oder leerer Foundry-Eintrag.');
  }
  const target=game.actors.get(row.targetId);
  return {index:row.index,key,targetId:row.targetId,expected:target?targetState(target):null,active:active.map(actor=>({id:actor.id,expected:targetState(actor)}))};
 });
 for(const row of plan){const link=game.actors.get(row.targetId)?.getFlag(MODULE_ID,'companion');if(link?.key!==row.key&&plan.some(other=>other.key===link?.key))throw new Error('Ein bisheriger Begleiter ist zugleich Importziel und selbst zur Aktualisierung ausgewählt. Bitte getrennte Ziele wählen.');}
 return plan;
}
export function verifyCompanionImport(character,sourceActorId,plan=[]){
 const fresh=prepareCompanionImport(character,sourceActorId,plan);
 if(JSON.stringify(fresh)!==JSON.stringify(plan))throw new Error('Ein Begleiter oder seine Zuordnung wurde inzwischen geändert. Bitte den Import erneut öffnen.');
}
export async function applyCompanionImport(source,plan=[],{includeImages=true,ownerId='',tokenFrame='concrete',warn=message=>ui.notifications.warn(message)}={}){
 ownerAssignment(ownerId);
 const character=getCharacter(source);verifyCompanionImport(character,source.id,plan);
 for(const row of plan){
  verifyCompanionImport(character,source.id,[row]);
  const snapshot=companionSnapshot(character,row.index),existing=game.actors.get(row.targetId),old=row.active.map(item=>game.actors.get(item.id));
  let portrait=null;
  const imageSource=old.find(actor=>actor.img&&!actor.img.endsWith('mystery-man.svg'));
  if(includeImages&&imageSource&&imageSource.id!==existing?.id)portrait=await tokenFromActor(imageSource,tokenFrame);
  verifyCompanionImport(character,source.id,[row]);
  const image=portrait?await uploadPortrait(portrait):null,token=portrait?await uploadPortrait(portrait.token??portrait):null;
  verifyCompanionImport(character,source.id,[row]);
  const link={sourceActorId:source.id,key:row.key,active:true,tokenStyle:portrait?.tokenStyle??existing?.getFlag(MODULE_ID,'companion')?.tokenStyle??tokenFrame};
  let actor=existing;
  if(actor){
   await actor.setFlag(MODULE_ID,FLAG,retainCompanionChoices(getCharacter(actor),snapshot));await actor.setFlag(MODULE_ID,'companion',link);
   await actor.update({name:snapshot.profile.name,'prototypeToken.name':snapshot.profile.name});
   if(image)await applyPortrait(actor,image,warn,token);await assignOwner(actor,ownerId);
  }else actor=await foundry.documents.Actor.create({name:snapshot.profile.name,type:'character',img:image||'icons/svg/mystery-man.svg',ownership:{...source.ownership,[game.user.id]:CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,...ownerAssignment(ownerId)},prototypeToken:{name:snapshot.profile.name,actorLink:true,...(token?{texture:{src:token}}:{})},flags:{[MODULE_ID]:{[FLAG]:snapshot,companion:link}}});
  for(const previous of old)if(previous.id!==actor.id)await previous.setFlag(MODULE_ID,'companion',{...previous.getFlag(MODULE_ID,'companion'),active:false,replacedBy:actor.id});
 }
 const keys=companionEntries(character).flatMap((_member,index)=>{try{return [companionKey(character,index)];}catch{return [];}});
 await refreshCompanions(source,warn,{skipKeys:keys});
}
