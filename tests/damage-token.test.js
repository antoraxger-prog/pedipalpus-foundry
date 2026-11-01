import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rollDamage} from '../scripts/check-details.js';

function runtime(change=()=>{}){
 const actor={id:'owner',name:'Testfigur',isOwner:true},token={id:'token',actorId:actor.id,actorLink:true};let messages=0,evaluations=0;
 const tokens=new Map([[token.id,token]]);token.parent={id:'scene',tokens};
 globalThis.foundry={documents:{ChatMessage:{getSpeaker:({actor,token,scene})=>({actor:actor.id,token:token.id,scene:scene.id})}},dice:{Roll:class{async evaluate(){evaluations++;change({actor,token,tokens});}async toMessage(data){messages++;return data;}}}};
 return {actor,token,tokens,messages:()=>messages,evaluations:()=>evaluations};
}
const check={name:'Hieb',damage:'1W6+2'};

test('Damage cannot post for a token reassigned during evaluation',async()=>{
 const r=runtime(({token})=>{token.actorId='other';});await assert.rejects(rollDamage(r.actor,check,r.token),/Token.*nicht mehr/);assert.equal(r.messages(),0);
});
test('Damage cannot post for a token unlinked during evaluation',async()=>{
 const r=runtime(({token})=>{token.actorLink=false;});await assert.rejects(rollDamage(r.actor,check,r.token),/Token.*nicht mehr/);assert.equal(r.messages(),0);
});
test('Damage cannot post when its token document was removed or replaced in the scene',async()=>{
 for(const change of [({token,tokens})=>tokens.delete(token.id),({token,tokens})=>tokens.set(token.id,{...token})]){
  const r=runtime(change);await assert.rejects(rollDamage(r.actor,check,r.token),/Token.*entfernt/);assert.equal(r.messages(),0);
 }
});
test('An already removed token is rejected before creating a roll',async()=>{
 const r=runtime();r.tokens.clear();await assert.rejects(rollDamage(r.actor,check,r.token),/Token.*entfernt/);assert.equal(r.evaluations(),0);assert.equal(r.messages(),0);
});
test('A current linked token keeps its actor, token and scene speaker',async()=>{
 const r=runtime(),message=await rollDamage(r.actor,check,r.token);assert.deepEqual(message.speaker,{actor:r.actor.id,token:r.token.id,scene:'scene'});assert.equal(r.evaluations(),1);assert.equal(r.messages(),1);
});
test('A module-level revalidation failure aborts damage before the message is posted',async()=>{
 const r=runtime();await assert.rejects(rollDamage(r.actor,check,r.token,{verify:()=>{throw new Error('Waffe geändert');}}),/Waffe geändert/);assert.equal(r.evaluations(),1);assert.equal(r.messages(),0);
});
