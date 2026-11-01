import {test} from 'node:test';
import assert from 'node:assert/strict';
import {captureViewState,restoreViewState} from '../scripts/view-state.js';

test('View state tolerates an absent application element before first render or after closing',()=>{
 for(const element of [null,undefined]){
  assert.equal(captureViewState(element),null);
  assert.doesNotThrow(()=>restoreViewState(element,{identity:'old',focus:'old'}));
 }
});

test('An application shell without a probe surface has no state to restore',()=>{
 const element={querySelector:()=>null};assert.equal(captureViewState(element),null);
 assert.doesNotThrow(()=>restoreViewState(element,{identity:'old',focus:'old'}));
 assert.doesNotThrow(()=>restoreViewState(element,null));
});
