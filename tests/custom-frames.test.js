import {test} from 'node:test';
import assert from 'node:assert/strict';
import {frameWindowMask,validateCustomFrame,tokenStyles,savedCustomFrames} from '../scripts/custom-frames.js';
import {portraitWindowGeometry,savedPortraitFraming} from '../scripts/tokens.js';
import {validateWorkbench} from '../scripts/workbench.js';
import {framingFor} from '../scripts/portraits.js';
const hash='a'.repeat(64),entry={id:`custom-${hash}`,name:'Mein Rahmen',overlay:`worlds/test/pedipalpus-portraits/${hash}.png`,clip:`worlds/test/pedipalpus-portraits/${'b'.repeat(64)}.png`,width:120,height:80,window:{x:10,y:10,width:100,height:60}};
const ring=(w,h)=>{const data=new Uint8ClampedArray(w*h*4);for(let y=4;y<h-4;y++)for(let x=4;x<w-4;x++)if(x<10||x>=w-10||y<10||y>=h-10){const i=(y*w+x)*4;data[i]=200;data[i+2]=180;data[i+3]=255;}return data;};
test('Custom frame mask keeps the enclosed transparent window and discards the connected outside without altering frame colors',()=>{
 const data=ring(120,80),before=data.slice(),result=frameWindowMask(data,120,80);
 assert.equal(result.pixels[(40*120+60)*4+3],255);assert.equal(result.pixels[3],0);assert.equal(result.pixels[(3*120+60)*4+3],0);assert.deepEqual(result.window,{x:9,y:9,width:102,height:62});assert.deepEqual(data,before);
});
test('Frames need a closed transparent middle; opaque files, open borders and invalid dimensions fail',()=>{
 assert.throws(()=>frameWindowMask(new Uint8ClampedArray(40*40*4),40,40),/geschlossenen|geschlossenem/);
 assert.throws(()=>frameWindowMask(new Uint8ClampedArray(40*40*4).fill(255),40,40),/geschlossenem/);
 const data=ring(120,80);for(let y=0;y<12;y++)data[(y*120+60)*4+3]=0;assert.throws(()=>frameWindowMask(data,120,80),/geschlossenem/);
 assert.throws(()=>frameWindowMask([],1,1),/16 bis 2048/);
});
test('The largest closed window wins over decorative pinholes',()=>{
 const data=ring(120,80);data[(6*120+60)*4+3]=0;const result=frameWindowMask(data,120,80);assert.equal(result.pixels[(6*120+60)*4+3],0);assert.equal(result.pixels[(40*120+60)*4+3],255);
});
test('Saved custom frames validate identities, image paths and window bounds before becoming choices',()=>{
 assert.ok(validateCustomFrame(entry));for(const value of [{...entry,id:'../x'},{...entry,overlay:'https://other/frame.png'},{...entry,clip:'data:image/png;base64,a'},{...entry,window:{x:10,y:0,width:120,height:80}},{...entry,width:5000}])assert.equal(validateCustomFrame(value),null);
 globalThis.game={settings:{get:()=>({[entry.id]:entry,bad:{id:'__proto__'}})}};assert.equal(Object.keys(savedCustomFrames()).length,1);assert.equal(tokenStyles().length,4);assert.equal(validateWorkbench({tokenFrame:entry.id}).tokenFrame,entry.id);
});
test('An actor carries its custom frame so another user can reopen the same crop without owning that library',()=>{
 globalThis.game={settings:{get:()=>({})}};const framing=framingFor({tokenCrop:{x:0,y:.4,zoom:1.2},tokenStyle:entry.id,tokenFrame:entry});const saved=savedPortraitFraming({getFlag:()=>framing});assert.equal(saved.style,entry.id);assert.deepEqual(saved.frame,entry);assert.equal(tokenStyles(saved.frame).at(-1)[0],entry.id);assert.equal(tokenStyles().length,3);assert.equal(validateWorkbench({tokenFrame:entry.id}).tokenFrame,'concrete');
});
test('Rectangular crop geometry covers the actual opening, keeps aspect ratio and never exposes empty margins',()=>{
 const area={x:20,y:180,width:470,height:150};for(const x of [-1,0,1])for(const y of [-1,0,1]){const r=portraitWindowGeometry(300,900,{x,y,zoom:1.5},area);assert.ok(r.x<=area.x&&r.y<=area.y);assert.ok(r.x+r.width>=area.x+area.width&&r.y+r.height>=area.y+area.height);assert.ok(Math.abs(r.width/r.height-1/3)<1e-12);}
});
