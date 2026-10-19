import { readCharacterFile } from './bundle.js';
import { parseCharacter } from './data.js';

const memory=new Map();
const sourceKey=actorId=>JSON.stringify([game.world.id,game.user.id,actorId]);
function database(){return new Promise((resolve,reject)=>{const request=indexedDB.open('pedipalpus-import-sources',1);request.onupgradeneeded=()=>request.result.createObjectStore('sources');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
export async function rememberImportSource(actorId,source){
 const key=sourceKey(actorId);memory.set(key,source);
 let db;
 try{db=await database();await new Promise((resolve,reject)=>{const tx=db.transaction('sources','readwrite');tx.objectStore('sources').put(source,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
 catch{ /* Der aktuelle Browserlauf behält die Quelle auch ohne dauerhafte Speicherung. */ }
 finally{db?.close();}
}
export async function importSource(actorId){
 const key=sourceKey(actorId);if(memory.has(key))return memory.get(key);
 let db;
 try{db=await database();return await new Promise((resolve,reject)=>{const request=db.transaction('sources').objectStore('sources').get(key);request.onsuccess=()=>resolve(request.result??null);request.onerror=()=>reject(request.error);});}
 catch{return null;}finally{db?.close();}
}
async function permit(handle){
 if(!handle)return false;
 if(!handle.queryPermission||await handle.queryPermission({mode:'read'})==='granted')return true;
 return typeof handle.requestPermission==='function'&&await handle.requestPermission({mode:'read'})==='granted';
}
export async function directoryCharacters(directory,kind='all'){
 if(!await permit(directory))throw new Error('Der Ordnerzugriff wurde nicht freigegeben.');
 const folders=[];for(const name of kind==='npc'?['SavedNpcs']:kind==='character'?['SavedCharacters']:['SavedCharacters','SavedNpcs']){try{folders.push(await directory.getDirectoryHandle(name));}catch{}}
 if(!folders.length)folders.push(directory);
 const files=[];for(const folder of folders)for await(const handle of folder.values())if(handle.kind==='file'&&/\.json$/i.test(handle.name)){
  const npcFolder=/^SavedNpcs$/i.test(folder.name??''),characterFolder=/^SavedCharacters$/i.test(folder.name??''),npcFile=/\.nsc\.json$/i.test(handle.name);
  if(kind==='npc'&&(characterFolder||!npcFolder&&!npcFile))continue;
  if(kind==='character'&&(npcFolder||npcFile))continue;
  files.push(handle);
 }
 if(files.length>200)throw new Error('Bitte einen Charakterordner mit höchstens 200 Dateien auswählen.');
 return files.sort((a,b)=>a.name.localeCompare(b.name,'de'));
}
export async function readLiveSource(source,{includePortrait=true}={}){
 if(!source?.fileHandle||!await permit(source.fileHandle))throw new Error('Die letzte Datei ist nicht zugänglich. Bitte die Quelle erneut auswählen.');
 const file=await source.fileHandle.getFile(),imported=await readCharacterFile(file,{includePortrait}),parsed=parseCharacter(imported.json);
 let portrait=imported.portrait;
 const filename=parsed.profile.portraitFileName;
 if(includePortrait&&!portrait&&filename&&source.directoryHandle&&await permit(source.directoryHandle)){
  if(/[\\/\u0000-\u001f]/.test(filename)||filename==='.'||filename==='..')throw new Error('Der gespeicherte Bilddateiname ist ungültig.');
  let portraits=source.directoryHandle;try{portraits=await portraits.getDirectoryHandle('CharacterPortraits');}catch{}
  try{portrait=await(await portraits.getFileHandle(filename)).getFile();}catch(error){if(error.name!=='NotFoundError')throw error;}
 }
 return {...imported,portrait};
}
