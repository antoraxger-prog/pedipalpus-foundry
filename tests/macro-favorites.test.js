import {test} from 'node:test';
import assert from 'node:assert/strict';
import {retinueFixture} from './fixture.js';
import {normalizeCharacter} from '../scripts/data.js';
import {checkReference,favoriteAvailability} from '../scripts/workbench.js';
import {companionKey,companionSnapshot,companionRollIssue} from '../scripts/companions.js';
import {rollDamage} from '../scripts/check-details.js';

function runtime(){
 const raw=retinueFixture(),character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)},actors=[];
 const make=(id,character,companion)=>({id,flags:{character,companion},getFlag(_namespace,key){return this.flags[key];}});
 const parent=make('parent',character),child=make('child',companionSnapshot(character,0),{sourceActorId:'parent',key:companionKey(character,0)});actors.push(parent,child);globalThis.game={actors:{contents:actors,get:id=>actors.find(actor=>actor.id===id)}};return {raw,character,parent,child,actors};
}
test('Current linked companions are rollable without requiring edit access to their parent',()=>{
 const r=runtime();r.parent.isOwner=false;assert.equal(companionRollIssue(r.child),'');assert.equal(companionRollIssue(r.parent),'');assert.equal(companionRollIssue(null),'');
});
test('Replaced companion links are blocked without deleting old snapshots or images',()=>{
 const r=runtime(),snapshot=JSON.stringify(r.child.flags.character);r.child.img='preserved.webp';r.child.flags.companion.active=false;assert.match(companionRollIssue(r.child),/wurde ersetzt/);assert.equal(JSON.stringify(r.child.flags.character),snapshot);assert.equal(r.child.img,'preserved.webp');
});
test('Missing parent, removed child and nested links cannot be used as current companion references',()=>{
 for(const mutate of [r=>r.actors.splice(0,1),r=>r.actors.splice(1,1),r=>{r.parent.flags.companion={sourceActorId:'other'};}]){const r=runtime();mutate(r);assert.match(companionRollIssue(r.child),/nicht mehr vorhanden|nicht mehr eindeutig/);}
});
test('Removed and duplicate members block a child while reordering preserves its unique identity',()=>{
 const r=runtime();r.raw.Animals.unshift({...r.raw.Animals[0],Name:'Anderer Träger',InventoryId:'other'});r.parent.flags.character={...normalizeCharacter(r.raw),sourceJSON:JSON.stringify(r.raw)};assert.equal(companionRollIssue(r.child),'');
 r.raw.Animals.push({...r.raw.Animals[1]});r.parent.flags.character={...normalizeCharacter(r.raw),sourceJSON:JSON.stringify(r.raw)};assert.match(companionRollIssue(r.child),/nicht mehr eindeutig/);
 r.raw.Animals=[];r.parent.flags.character={...normalizeCharacter(r.raw),sourceJSON:JSON.stringify(r.raw)};assert.match(companionRollIssue(r.child),/nicht mehr eindeutig/);
});
test('Favorite availability marks missing entries without deleting or changing their order',()=>{
 const {character}=runtime(),check=character.checks.find(check=>check.name==='Geographie'),valid=checkReference(check),missing={...valid,name:'Entfernte Probe'},refs=[missing,valid],before=JSON.stringify(refs),rows=favoriteAvailability(character,refs);
 assert.equal(rows[0].check,null);assert.match(rows[0].reason,/nicht mehr vorhanden/);assert.equal(rows[1].check,check);assert.equal(rows[1].reference,valid);assert.equal(JSON.stringify(refs),before);
});
test('An ambiguous favorite is unavailable while a currently blocked but existing probe remains available',()=>{
 const {character}=runtime(),check=character.checks.find(check=>check.name==='Geographie'),reference=checkReference(check),duplicate={...character,checks:[...character.checks,{...check,id:'duplicate'}]};
 assert.match(favoriteAvailability(duplicate,[reference])[0].reason,/mehrdeutig/);
 const blocked={...character,checks:character.checks.map(row=>row===check?{...row,reason:'Nicht handlungsfähig'}:row)};assert.equal(favoriteAvailability(blocked,[reference])[0].reason,'');assert.equal(favoriteAvailability(blocked,[reference])[0].check.reason,'Nicht handlungsfähig');
});
test('Favorite availability follows semantic references after insertion and includes no unrelated entries',()=>{
 const {raw,character}=runtime(),reference=checkReference(character.checks.find(check=>check.name==='Geographie'));raw.AcademicSkills[0].Subskills.unshift({Name:'Andere Probe',TotalValue:4});const next=normalizeCharacter(raw),rows=favoriteAvailability(next,[reference]);assert.equal(rows.length,1);assert.equal(rows[0].check.id,'AcademicSkills:0:1');assert.equal(rows[0].check.name,'Geographie');assert.deepEqual(favoriteAvailability(next),[]);
});

test('Damage rechecks a changed companion after evaluation before publishing the message',async()=>{
 const r=runtime();r.child.isOwner=true;let messages=0;
 globalThis.foundry={dice:{Roll:class{async evaluate(){r.child.flags.companion.active=false;}async toMessage(){messages++;}}}};
 await assert.rejects(rollDamage(r.child,{name:'Hieb',damage:'1W6+2'},null,{verify:()=>{const issue=companionRollIssue(r.child);if(issue)throw new Error(issue);}}),/wurde ersetzt/);assert.equal(messages,0);
});

test('Damage ownership lost during evaluation stops before publishing',async()=>{
 const actor={id:'owner',isOwner:true};let messages=0;
 globalThis.foundry={dice:{Roll:class{async evaluate(){actor.isOwner=false;}async toMessage(){messages++;}}}};
 await assert.rejects(rollDamage(actor,{name:'Hieb',damage:'1W6+2'}),/Besitzerrechte/);assert.equal(messages,0);
});
