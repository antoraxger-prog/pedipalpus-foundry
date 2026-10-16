import { MODULE_ID, FLAG, SCHEMA_VERSION } from './data.js';
import { getCharacter } from './storage.js';
import { uploadPortrait,applyPortrait } from './portraits.js';
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
export function companionActor(sourceActorId,key){return game.actors.contents.find(actor=>{const link=actor.getFlag(MODULE_ID,'companion');return link?.sourceActorId===sourceActorId&&link.key===key;});}
export function companionSnapshot(character,index){
 const member=companionEntries(character)[index];companionKey(character,index);
 const item=(character.equipment??[]).find(item=>item.id===`${member._collection}:${member._index}`);
 const prefix=`${member._group}:${member._index}:`;
 const checks=(character.checks??[]).filter(check=>isCompanionCheck(check)&&check.id.startsWith(prefix)).map(check=>({...check,id:check.id.replace(prefix,`${member._group}:0:`),companionIndex:0}));
 return {schemaVersion:SCHEMA_VERSION,combatSchemaVersion:1,retinueSchemaVersion:1,retinue:[{...member,_index:0}],sourceVersion:character.sourceVersion,importedAt:character.importedAt,profile:{name:String(member.Name),portraitFileName:'',race:String(member.Domain??member.Species??''),companionGroup:member._group},attributes:memberAttributes(member),checks,equipment:item?[{...item,id:`${member._collection}:0`}]:[],resources:[{name:'LE',value:member.CurrentLe??null,max:member.MaxLe??null},{name:'AE',value:member.CurrentAstralEnergy??null,max:member.AstralEnergy??null}],derived:[],details:[],warnings:[],secondary:[],conditions:{simple:[],complex:[]},combat:{stats:[],melee:[],ranged:[]}};
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
export async function refreshCompanions(source,warn=message=>ui.notifications.warn(message)){
 const character=getCharacter(source);if(!character||source.getFlag(MODULE_ID,'companion')?.sourceActorId)return;
 const keys=companionEntries(character).map((_member,index)=>{try{return companionKey(character,index);}catch{return null;}});
 for(const actor of game.actors.contents){
  const link=actor.getFlag(MODULE_ID,'companion');if(link?.sourceActorId!==source.id)continue;
  if(!actor.canUserModify(game.user,'update')){warn(`${actor.name}: Gefolgewerte konnten wegen fehlender Bearbeitungsrechte nicht aktualisiert werden.`);continue;}
  const index=keys.indexOf(link.key),previous=getCharacter(actor);
  if(index<0){if(previous)await actor.setFlag(MODULE_ID,FLAG,{...previous,checks:[],warnings:['Dieses Gefolgsmitglied ist im aktuellen Import nicht eindeutig enthalten.']});continue;}
  await actor.setFlag(MODULE_ID,FLAG,retainCompanionChoices(previous,companionSnapshot(character,index)));
 }
}
