import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyPortrait,portraitState} from '../scripts/portraits.js';

function runtime(){
 const writes=[],tokenWrites=[];let framing={x:0,y:0,zoom:1,style:'concrete'};
 const actor={id:'portrait-owner',img:'original.png',canUserModify:()=>true,getFlag:()=>framing,async update(data){writes.push(data);}};
 const token={actorId:actor.id,actorLink:true,canUserModify:()=>true,async update(data){tokenWrites.push(data);}};
 globalThis.game={user:{id:'owner'},scenes:{contents:[{tokens:{contents:[token]}}]}};
 return {actor,writes,tokenWrites,setFraming:value=>{framing=value;}};
}

test('A changed original portrait rejects an outdated token update before actor or scene writes',async()=>{
 const {actor,writes,tokenWrites}=runtime(),expected=portraitState(actor);
 actor.img='new-portrait.png';
 await assert.rejects(applyPortrait(actor,'original.png',()=>{},'old-token.png',null,expected),/inzwischen/);
 assert.deepEqual(writes,[]);assert.deepEqual(tokenWrites,[]);
});

test('A crop-only concurrent edit also rejects a prepared token from the previous framing',async()=>{
 const {actor,writes,tokenWrites,setFraming}=runtime(),expected=portraitState(actor);
 setFraming({x:0,y:1,zoom:1,style:'concrete'});
 await assert.rejects(applyPortrait(actor,'original.png',()=>{},'old-token.png',null,expected),/inzwischen/);
 assert.deepEqual(writes,[]);assert.deepEqual(tokenWrites,[]);
});

test('Unchanged portrait guards allow the intended update while lost permissions block it',async()=>{
 const {actor,writes,tokenWrites}=runtime(),expected=portraitState(actor),framing={x:0,y:1,zoom:1,style:'undead'};
 await applyPortrait(actor,'original.png',()=>{},'fresh-token.png',framing,expected);
 assert.equal(writes.length,1);assert.equal(writes[0]['prototypeToken.texture.src'],'fresh-token.png');assert.deepEqual(writes[0]['flags.pedipalpus-foundry.portraitFraming'],framing);
 assert.deepEqual(tokenWrites,[{'texture.src':'fresh-token.png'}]);
 actor.canUserModify=()=>false;
 await assert.rejects(applyPortrait(actor,'other.png',()=>{},'other-token.png',null,expected),/Besitzerrechte/);
 assert.equal(writes.length,1);assert.equal(tokenWrites.length,1);
});

test('A newer portrait during scene propagation stops remaining stale token writes',async()=>{
 const {actor,tokenWrites}=runtime(),warnings=[];
 const first=game.scenes.contents[0].tokens.contents[0],second={...first,async update(data){tokenWrites.push(data);}};
 first.update=async data=>{tokenWrites.push(data);actor.img='newer-portrait.png';};
 game.scenes.contents[0].tokens.contents.push(second);
 await applyPortrait(actor,'original.png',message=>warnings.push(message),'prepared-token.png',null,portraitState(actor));
 assert.deepEqual(tokenWrites,[{'texture.src':'prepared-token.png'}]);
 assert.equal(actor.img,'newer-portrait.png');assert.equal(warnings.length,1);assert.match(warnings[0],/1 verknüpfte Tokens.*zwischenzeitlichen/);
});

test('A prototype token changed while the portrait editor was open rejects the old crop before writes',async()=>{
 const {actor,writes,tokenWrites}=runtime();actor.prototypeToken={texture:{src:'old-token.png'}};const expected=portraitState(actor);
 actor.prototypeToken.texture.src='independent-token.png';
 await assert.rejects(applyPortrait(actor,'original.png',()=>{},'stale-token.png',null,expected),/inzwischen/);
 assert.equal(actor.img,'original.png');assert.deepEqual(writes,[]);assert.deepEqual(tokenWrites,[]);
});

test('A newer prototype token during propagation stops the remaining scene updates',async()=>{
 const {actor,tokenWrites}=runtime(),warnings=[];actor.prototypeToken={texture:{src:'prepared-token.png'}};
 const first=game.scenes.contents[0].tokens.contents[0],second={...first,async update(data){tokenWrites.push(data);}};
 first.update=async data=>{tokenWrites.push(data);actor.prototypeToken.texture.src='newer-token.png';};
 game.scenes.contents[0].tokens.contents.push(second);
 await applyPortrait(actor,'original.png',message=>warnings.push(message),'prepared-token.png',null,portraitState(actor));
 assert.deepEqual(tokenWrites,[{'texture.src':'prepared-token.png'}]);assert.equal(actor.prototypeToken.texture.src,'newer-token.png');assert.match(warnings[0],/1 verknüpfte Tokens/);
});
