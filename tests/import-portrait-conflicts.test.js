import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCharacter} from '../scripts/data.js';
import {fixture} from './fixture.js';
import {saveCharacter} from '../scripts/storage.js';
import {portraitState} from '../scripts/portraits.js';

function runtime(){
 const snapshot=normalizeCharacter(fixture()),flags={character:snapshot},counts={flags:0,images:0,uploads:0};
 const actor={id:'hero',img:'original.png',prototypeToken:{texture:{src:'token.png'}},getFlag:(_ns,key)=>flags[key],canUserModify:()=>true,
  async setFlag(_ns,key,value){counts.flags++;flags[key]=value;},async update(){counts.images++;}};
 globalThis.game={system:{id:'worldbuilding'},world:{id:'world'},user:{id:'owner',isGM:true},actors:{get:()=>actor},scenes:{contents:[]}};
 globalThis.foundry={applications:{apps:{FilePicker:{implementation:{browse:async()=>({dirs:['worlds/world/pedipalpus-portraits'],files:[]}),upload:async()=>{counts.uploads++;return {path:'worlds/world/pedipalpus-portraits/upload.png'};}}}}}};
 const portrait={file:new File(['picture'],'portrait.png',{type:'image/png'}),extension:'png'};
 return {snapshot,actor,counts,portrait};
}

test('A token-only change during the import comparison stops before upload or character writes',async()=>{
 const {snapshot,actor,counts,portrait}=runtime(),expected=portraitState(actor);actor.prototypeToken.texture.src='newer-token.png';
 await assert.rejects(saveCharacter(snapshot,actor.id,portrait,()=>{},JSON.stringify(snapshot),{portraitExpected:expected}),/Charakterbild wurde inzwischen geändert/);
 assert.deepEqual(counts,{flags:0,images:0,uploads:0});assert.equal(actor.prototypeToken.texture.src,'newer-token.png');
});

test('A token-only change during upload stops before character writes',async()=>{
 const {snapshot,actor,counts,portrait}=runtime(),expected=portraitState(actor),picker=foundry.applications.apps.FilePicker.implementation,upload=picker.upload;
 picker.upload=async(...args)=>{const result=await upload(...args);actor.prototypeToken.texture.src='newer-token.png';return result;};
 await assert.rejects(saveCharacter(snapshot,actor.id,portrait,()=>{},JSON.stringify(snapshot),{portraitExpected:expected}),/Charakterbild wurde inzwischen geändert/);
 assert.deepEqual(counts,{flags:0,images:0,uploads:1});assert.equal(actor.prototypeToken.texture.src,'newer-token.png');
});

test('A token changed during the character flag write survives without an image update',async()=>{
 const {snapshot,actor,counts,portrait}=runtime(),expected=portraitState(actor),setFlag=actor.setFlag.bind(actor);
 actor.setFlag=async(...args)=>{await setFlag(...args);actor.prototypeToken.texture.src='newer-token.png';};
 await assert.rejects(saveCharacter(snapshot,actor.id,portrait,()=>{},JSON.stringify(snapshot),{portraitExpected:expected}),/Charakterbild wurde inzwischen geändert/);
 assert.deepEqual(counts,{flags:1,images:0,uploads:1});assert.equal(actor.prototypeToken.texture.src,'newer-token.png');
});

test('An import without images keeps independently changed portrait and prototype token',async()=>{
 const {snapshot,actor,counts}=runtime(),expected=portraitState(actor);actor.img='independent-portrait.png';actor.prototypeToken.texture.src='independent-token.png';
 await saveCharacter(snapshot,actor.id,null,()=>{},JSON.stringify(snapshot),{portraitExpected:expected});
 assert.deepEqual(counts,{flags:1,images:0,uploads:0});assert.equal(actor.img,'independent-portrait.png');assert.equal(actor.prototypeToken.texture.src,'independent-token.png');
});

test('A player without upload permission can import values without replacing existing artwork',async()=>{
 const {snapshot,actor,counts,portrait}=runtime(),expected=portraitState(actor),next=structuredClone(snapshot),warnings=[];
 game.user.isGM=false;game.user.can=()=>false;
 next.checks[0].value++;
 await saveCharacter(next,actor.id,portrait,message=>warnings.push(message),JSON.stringify(snapshot),{portraitExpected:expected});
 assert.equal(actor.getFlag('pedipalpus-foundry','character').checks[0].value,next.checks[0].value);
 assert.equal(portraitState(actor),expected);
 assert.deepEqual(counts,{flags:1,images:0,uploads:0});
 assert.match(warnings[0],/Upload-Rechte fehlen/);
});

test('Losing upload permission between portrait and token uploads still imports values and keeps both images',async()=>{
 const {snapshot,actor,counts,portrait}=runtime(),expected=portraitState(actor),picker=foundry.applications.apps.FilePicker.implementation,warnings=[];
 const upload=picker.upload;picker.upload=async(...args)=>{const result=await upload(...args);game.user.isGM=false;return result;};
 await saveCharacter(snapshot,actor.id,{...portrait,token:portrait},message=>warnings.push(message),JSON.stringify(snapshot),{portraitExpected:expected});
 assert.deepEqual(counts,{flags:1,images:0,uploads:1});
 assert.equal(portraitState(actor),expected);
 assert.match(warnings[0],/Upload-Rechte fehlen/);
});
