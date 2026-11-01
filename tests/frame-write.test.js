import {test} from 'node:test';
import assert from 'node:assert/strict';
import {saveCustomFrame} from '../scripts/custom-frames.js';

const frame=n=>{const hash=n.toString(16).padStart(64,'0');return {id:`custom-${hash}`,name:`Rahmen ${n}`,overlay:`worlds/test/pedipalpus-portraits/${hash}.png`,clip:`worlds/test/pedipalpus-portraits/${'f'.repeat(64)}.png`,width:120,height:80,window:{x:10,y:10,width:100,height:60}};};
function runtime(initial={}){
 let saved=structuredClone(initial);const writes=[];
 globalThis.game={world:{id:'test'},user:{id:'player'},settings:{get:()=>structuredClone(saved),async set(_module,_key,value){writes.push(value);saved=structuredClone(value);}}};
 return {writes,read:()=>saved};
}
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};

test('Overlapping frame saves preserve both additions even while the first setting write is pending',async()=>{
 const {writes,read}=runtime(),entered=deferred(),release=deferred(),set=game.settings.set;
 game.settings.set=async(...args)=>{if(!writes.length){entered.resolve();await release.promise;}return set(...args);};
 const a=saveCustomFrame(frame(1));await entered.promise;const b=saveCustomFrame(frame(2));await Promise.resolve();release.resolve();
 await Promise.all([a,b]);assert.equal(writes.length,2);assert.deepEqual(Object.keys(read()),[frame(1).id,frame(2).id]);
});

test('Concurrent duplicate imports keep the first saved metadata and write only once',async()=>{
 const {writes,read}=runtime();const [a,b]=await Promise.all([saveCustomFrame(frame(1)),saveCustomFrame({...frame(1),name:'Anderer Dateiname'})]);
 assert.deepEqual(a,b);assert.equal(read()[a.id].name,'Rahmen 1');assert.equal(writes.length,1);
});

test('Queued frame imports enforce the library limit against the completed previous save',async()=>{
 const initial=Object.fromEntries(Array.from({length:49},(_,i)=>{const value=frame(i+1);return [value.id,value];}));
 const {writes,read}=runtime(initial);const result=await Promise.allSettled([saveCustomFrame(frame(50)),saveCustomFrame(frame(51))]);
 assert.equal(result[0].status,'fulfilled');assert.equal(result[1].status,'rejected');assert.match(result[1].reason.message,/50 eigene/);assert.equal(Object.keys(read()).length,50);assert.equal(writes.length,1);
});

test('A rejected setting write does not poison the next queued frame import',async()=>{
 const {read}=runtime(),set=game.settings.set;let calls=0;
 game.settings.set=async(...args)=>{if(!calls++)throw new Error('Schreibfehler');return set(...args);};
 const result=await Promise.allSettled([saveCustomFrame(frame(1)),saveCustomFrame(frame(2))]);
 assert.equal(result[0].status,'rejected');assert.equal(result[1].status,'fulfilled');assert.deepEqual(Object.keys(read()),[frame(2).id]);
});

test('Malformed frame metadata never reaches the saved collection',async()=>{
 const {writes}=runtime();await assert.rejects(saveCustomFrame({...frame(1),clip:'https://other.invalid/image.png'}),/ungültig/);assert.equal(writes.length,0);
});

test('Adding a frame leaves existing frame metadata untouched',async()=>{
 const existing=frame(1),before=structuredClone(existing),{read}=runtime({[existing.id]:existing});await saveCustomFrame(frame(2));assert.deepEqual(existing,before);assert.deepEqual(read()[existing.id],before);
});
