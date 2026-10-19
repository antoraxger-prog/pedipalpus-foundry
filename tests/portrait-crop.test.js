import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_CROP,normalizeCrop,portraitGeometry,savedPortraitFraming} from '../scripts/tokens.js';
import {framingFor,applyPortrait} from '../scripts/portraits.js';
import {saveCharacter} from '../scripts/storage.js';
import {normalizeCharacter} from '../scripts/data.js';
import {fixture} from './fixture.js';
import {companionTargetState} from '../scripts/companions.js';
test('Portrait crop preserves the old centered cover and moves tall or wide pictures to both edges without empty margins',()=>{
 assert.deepEqual(portraitGeometry(200,600),{x:0,y:-512,width:512,height:1536});
 assert.deepEqual(portraitGeometry(200,600,{x:0,y:1,zoom:1}),{x:0,y:0,width:512,height:1536});
 assert.deepEqual(portraitGeometry(600,200,{x:-1,y:0,zoom:1}),{x:-1024,y:0,width:1536,height:512});
 for(const size of [[200,600],[600,200],[200,200]])for(const zoom of [1,1.5,3])for(const x of [-1,0,1])for(const y of [-1,0,1]){const rect=portraitGeometry(...size,{x,y,zoom});assert.ok(rect.x<=0&&rect.y<=0);assert.ok(rect.x+rect.width>=512&&rect.y+rect.height>=512);}
});
test('Crop validation rejects invalid numbers and zooms before bitmap work, with isolated per-actor defaults',()=>{
 for(const value of [{x:NaN},{y:Infinity},{zoom:0},{zoom:3.1},{x:1.1},{zoom:'2'}])assert.throws(()=>normalizeCrop(value),/ungültig/);
 assert.deepEqual(normalizeCrop(),DEFAULT_CROP);assert.throws(()=>portraitGeometry(0,1),/Bildgröße/);
 const actor=value=>({getFlag:()=>value});assert.equal(savedPortraitFraming(actor(null)),null);assert.equal(savedPortraitFraming(actor({x:NaN})),null);
 assert.deepEqual(savedPortraitFraming(actor({x:0,y:.8,zoom:1.2,style:'undead'})),{x:0,y:.8,zoom:1.2,style:'undead'});
 assert.equal(savedPortraitFraming(actor({style:'../unsafe'})).style,'concrete');
});
test('Framing travels separately from original portrait bytes and persists with linked-token image updates only when supplied',async()=>{
 const portrait={file:{original:true},tokenCrop:{x:.4,y:.8,zoom:2},tokenStyle:'undead'},framing=framingFor(portrait);assert.deepEqual(framing,{x:.4,y:.8,zoom:2,style:'undead'});assert.equal(portrait.file.original,true);assert.equal(framingFor(null),null);
 let update,tokenUpdate;const token={actorId:'a',actorLink:true,canUserModify:()=>true,async update(data){tokenUpdate=data;}};globalThis.game={user:{},scenes:{contents:[{tokens:{contents:[token]}}]}};
 const actor={id:'a',canUserModify:()=>true,async update(data){update=data;}};
 await applyPortrait(actor,'original.png',()=>{},'crop.png',framing);assert.equal(update.img,'original.png');assert.equal(update['prototypeToken.texture.src'],'crop.png');assert.deepEqual(update['flags.pedipalpus-foundry.portraitFraming'],framing);assert.deepEqual(tokenUpdate,{'texture.src':'crop.png'});
 await applyPortrait(actor,'other.png',()=>{},'other-token.png');assert.equal(Object.keys(update).length,2);
});
test('Companion fingerprints include crop settings even when unchanged token pixels yield the same image path',()=>{
 let crop={x:0,y:0,zoom:1};const actor={name:'Wolf',getFlag:(_ns,key)=>key==='portraitFraming'?crop:null};const before=companionTargetState(actor);crop={x:1,y:0,zoom:1};assert.notEqual(companionTargetState(actor),before);
});

test('An import cannot overwrite a portrait crop changed while its comparison was open',async()=>{
 const snapshot=normalizeCharacter(fixture()),actor={img:'new.png',getFlag:(_ns,key)=>key==='character'?snapshot:key==='portraitFraming'?{x:0,y:1,zoom:1}:null,canUserModify:()=>true};
 globalThis.game={user:{id:'owner'},system:{id:'worldbuilding'},actors:{get:()=>actor}};
 await assert.rejects(saveCharacter(snapshot,'a',{file:null},()=>{},JSON.stringify(snapshot),{portraitExpected:JSON.stringify({img:'old.png',framing:null})}),/inzwischen/);
});
