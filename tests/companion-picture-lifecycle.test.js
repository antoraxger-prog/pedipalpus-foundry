import {test} from 'node:test';
import assert from 'node:assert/strict';
import {retinueFixture} from './fixture.js';
import {normalizeCharacter} from '../scripts/data.js';
import {savePlayState} from '../scripts/storage.js';
import {saveCompanion,companionKey,companionSnapshot} from '../scripts/companions.js';

function runtime({existing=false}={}){
 const raw=retinueFixture(),character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)},actors=[],writes=[],uploads=[];
 const actor=(id,data,link)=>({id,name:data.profile.name,isOwner:true,img:'kept.webp',prototypeToken:{texture:{src:'kept-token.webp'}},ownership:{owner:3},flags:{character:data,companion:link},getFlag(_ns,key){return this.flags[key];},canUserModify:()=>true,async setFlag(_ns,key,value){writes.push([id,key]);this.flags[key]=structuredClone(value);},async update(data){writes.push([id,'image']);for(const [key,value]of Object.entries(data)){const parts=key.split('.');let target=this;for(const part of parts.slice(0,-1))target=target[part]??={};target[parts.at(-1)]=value;}}});
 const parent=actor('parent',character);actors.push(parent);const key=companionKey(character,0),child=existing?actor('child',companionSnapshot(character,0),{sourceActorId:parent.id,key}):null;if(child)actors.push(child);
 globalThis.game={user:{id:'owner',isGM:true},world:{id:'test-world'},actors:{contents:actors,get:id=>actors.find(row=>row.id===id)},scenes:{contents:[]}};globalThis.CONST={DOCUMENT_OWNERSHIP_LEVELS:{OWNER:3}};
 globalThis.foundry={documents:{Actor:{canUserCreate:()=>true,async create(data){writes.push(['new','create']);return data;}}},applications:{apps:{FilePicker:{implementation:{browse:async()=>({dirs:['worlds/test-world/pedipalpus-portraits'],files:[]}),async upload(){uploads.push(true);return {path:`worlds/test-world/pedipalpus-portraits/${'a'.repeat(64)}.png`};}}}}}};
 const portrait={file:new File(['picture'],'portrait.png',{type:'image/png'}),extension:'png',tokenStyle:'concrete',tokenCrop:{x:0,y:0,zoom:1}};
 return {parent,child,key,character,actors,writes,uploads,portrait};
}
function duringUpload(change){const picker=foundry.applications.apps.FilePicker.implementation,upload=picker.upload;picker.upload=async(...args)=>{const result=await upload(...args);change();return result;};}

test('Removed or replaced source figures cannot create orphaned companion portraits after upload',async()=>{
 for(const replace of [false,true]){const r=runtime();duringUpload(()=>{r.actors.splice(0,1,...(replace?[{...r.parent}]:[]));});await assert.rejects(saveCompanion(r.parent,0,r.key,r.portrait),/Figur.*entfernt oder ersetzt/);assert.deepEqual(r.writes,[]);}
});
test('Deleting the parent before picture upload performs no upload or child update',async()=>{
 const r=runtime({existing:true}),before=JSON.stringify(r.child.flags);r.actors.splice(0,1);await assert.rejects(saveCompanion(r.parent,0,r.key,r.portrait),/Figur.*entfernt/);assert.deepEqual(r.uploads,[]);assert.deepEqual(r.writes,[]);assert.equal(JSON.stringify(r.child.flags),before);
});
test('A replaced target object with the same ID and values cannot receive detached portrait writes',async()=>{
 const r=runtime({existing:true}),before=JSON.stringify(r.child.flags);duringUpload(()=>{r.actors[1]={...r.child};});await assert.rejects(saveCompanion(r.parent,0,r.key,r.portrait),/Gefolgsbild.*inzwischen geändert/);assert.deepEqual(r.writes,[]);assert.equal(JSON.stringify(r.child.flags),before);assert.equal(r.actors[1].img,'kept.webp');
});
test('Lost actor creation rights during upload stop only new companion entries',async()=>{
 const r=runtime();duringUpload(()=>{foundry.documents.Actor.canUserCreate=()=>false;});await assert.rejects(saveCompanion(r.parent,0,r.key,r.portrait),/Spielleiter/);assert.deepEqual(r.writes,[]);
 const existing=runtime({existing:true});foundry.documents.Actor.canUserCreate=()=>false;const saved=await saveCompanion(existing.parent,0,existing.key,existing.portrait);assert.equal(saved,existing.child);assert.equal(existing.writes.filter(row=>row[1]==='image').length,1);
});
test('A current parent can still create one linked companion with its own image and token',async()=>{
 const r=runtime(),saved=await saveCompanion(r.parent,0,r.key,r.portrait);assert.equal(saved.flags['pedipalpus-foundry'].companion.sourceActorId,r.parent.id);assert.equal(saved.flags['pedipalpus-foundry'].companion.key,r.key);assert.equal(saved.img,saved.prototypeToken.texture.src);assert.deepEqual(r.writes,[['new','create']]);
});
test('A changed source link during upload cannot silently create a nested companion relationship',async()=>{
 const r=runtime();duringUpload(()=>{r.parent.flags.companion={sourceActorId:'other-parent',key:'other-key'};});await assert.rejects(saveCompanion(r.parent,0,r.key,r.portrait),/Gefolgsbild.*Zuordnung.*geändert/);assert.deepEqual(r.writes,[]);assert.equal(r.parent.flags.companion.sourceActorId,'other-parent');
});
test('Deleted or replaced figures cannot save stale play state even if the detached object still has owner rights',async()=>{
 for(const replace of [false,true]){const r=runtime({existing:true}),before=JSON.stringify(r.parent.flags);r.actors.splice(0,1,...(replace?[{...r.parent}]:[]));await assert.rejects(savePlayState(r.parent,{version:1,resources:{root:{LE:1}}},JSON.stringify(r.character)),/Figur.*entfernt oder ersetzt/);assert.deepEqual(r.writes,[]);assert.equal(JSON.stringify(r.parent.flags),before);}
});
