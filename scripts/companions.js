import { MODULE_ID, FLAG, SCHEMA_VERSION } from './data.js';
import { getCharacter } from './storage.js';
import { uploadPortrait,applyPortrait } from './portraits.js';

const list=value=>Array.isArray(value)?value.filter(item=>item&&typeof item==='object'):[];
export function companionEntries(character){
 try{return list(JSON.parse(character.sourceJSON.replace(/^\uFEFF/,'')).Animals);}
 catch{return (character?.equipment??[]).filter(item=>item.id?.startsWith('Animals:')).map(item=>({Name:item.name,Species:item.species,InventoryId:item.inventoryId,CurrentLe:item.currentLE,MaxLe:item.maxLE}));}
}
export function companionKey(character,index){
 const animals=companionEntries(character),animal=animals[index];if(!animal)throw new Error('Dieses Tier ist im aktuellen Charakter nicht mehr vorhanden.');
 const name=String(animal.Name??'').normalize('NFC').trim(),species=String(animal.Species??'').normalize('NFC').trim(),id=String(animal.InventoryId??'').trim();
 const key=id?`id:${id}`:JSON.stringify([name.toLocaleLowerCase('de'),species.toLocaleLowerCase('de')]);
 const duplicates=animals.filter(item=>id?String(item.InventoryId??'').trim()===id:!item.InventoryId&&String(item.Name??'').normalize('NFC').trim().toLocaleLowerCase('de')===name.toLocaleLowerCase('de')&&String(item.Species??'').normalize('NFC').trim().toLocaleLowerCase('de')===species.toLocaleLowerCase('de'));
 if(!name||duplicates.length!==1)throw new Error('Dieses Tier ist nicht eindeutig zugeordnet. Bitte in Pedipalpus eindeutige Namen speichern.');
 return key;
}
export function companionActor(sourceActorId,key){return game.actors.contents.find(actor=>{const link=actor.getFlag(MODULE_ID,'companion');return link?.sourceActorId===sourceActorId&&link.key===key;});}
export function companionSnapshot(character,index){
 const animal=companionEntries(character)[index];companionKey(character,index);
 const item=(character.equipment??[]).find(item=>item.id===`Animals:${index}`);
 const checks=(character.checks??[]).filter(check=>check.id?.startsWith(`animals:${index}:`)).map(check=>({...check,id:check.id.replace(`animals:${index}:`,'animals:0:')}));
 return {schemaVersion:SCHEMA_VERSION,combatSchemaVersion:1,sourceVersion:character.sourceVersion,importedAt:character.importedAt,profile:{name:String(animal.Name),portraitFileName:'',race:String(animal.Species??'')},attributes:[],checks,equipment:item?[{...item,id:'Animals:0'}]:[],resources:[{name:'LE',value:animal.CurrentLe??null,max:animal.MaxLe??null}],derived:[],details:[],warnings:[],secondary:[],conditions:{simple:[],complex:[]},combat:{stats:[],melee:[],ranged:[]}};
}
export async function saveCompanion(source,index,expectedKey,portrait,warn){
 if(!source?.isOwner||!source.canUserModify(game.user,'update'))throw new Error('Zum Anlegen eines Tier-Tokens werden Besitzerrechte benötigt.');
 const character=getCharacter(source),key=companionKey(character,index);if(key!==expectedKey)throw new Error('Das Tier wurde inzwischen geändert. Bitte erneut auswählen.');
 const snapshot=companionSnapshot(character,index),existing=companionActor(source.id,key);
 if(existing&&!existing.canUserModify(game.user,'update'))throw new Error('Für diesen Tier-Charakter fehlen Bearbeitungsrechte.');
 if(!existing&&!foundry.documents.Actor.canUserCreate(game.user))throw new Error('Dein Spielleiter muss den Tier-Charakter anlegen oder dir die Berechtigung dafür geben.');
 const image=await uploadPortrait(portrait),token=await uploadPortrait(portrait.token??portrait),link={sourceActorId:source.id,key,tokenStyle:portrait.tokenStyle};
 if(existing){await existing.setFlag(MODULE_ID,FLAG,snapshot);await existing.setFlag(MODULE_ID,'companion',link);await applyPortrait(existing,image,warn,token);return existing;}
 return foundry.documents.Actor.create({name:snapshot.profile.name,type:'character',img:image,ownership:{...source.ownership,[game.user.id]:CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER},prototypeToken:{name:snapshot.profile.name,actorLink:true,texture:{src:token}},flags:{[MODULE_ID]:{[FLAG]:snapshot,companion:link}}});
}

export async function refreshCompanions(source,warn=message=>ui.notifications.warn(message)){
 const character=getCharacter(source);if(!character)return;
 const keys=companionEntries(character).map((_animal,index)=>{try{return companionKey(character,index);}catch{return null;}});
 for(const actor of game.actors.contents){
  const link=actor.getFlag(MODULE_ID,'companion');if(link?.sourceActorId!==source.id)continue;
  if(!actor.canUserModify(game.user,'update')){warn(`${actor.name}: Tierwerte konnten wegen fehlender Bearbeitungsrechte nicht aktualisiert werden.`);continue;}
  const index=keys.indexOf(link.key),previous=getCharacter(actor);
  if(index<0){if(previous)await actor.setFlag(MODULE_ID,FLAG,{...previous,checks:[],warnings:['Dieses Tier ist im aktuellen Import nicht eindeutig enthalten.']});continue;}
  await actor.setFlag(MODULE_ID,FLAG,companionSnapshot(character,index));
 }
}
