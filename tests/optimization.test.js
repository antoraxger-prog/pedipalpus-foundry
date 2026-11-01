import {test} from 'node:test';
import assert from 'node:assert/strict';
import {retinueFixture,npcFixture} from './fixture.js';
import {normalizeCharacter} from '../scripts/data.js';
import {readCompanions,withCompanionImport} from '../scripts/retinue.js';
import {compactLocalState,conditionRows,memberStateKey,withPlayState,retainPlayState} from '../scripts/play-state.js';
const snapshot=raw=>({...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw),retinueImportEnabled:true});

test('Companion parsing is reused within a snapshot and invalidates when source bytes or state change',()=>{
 const raw=retinueFixture(),data=snapshot(raw),parse=JSON.parse;let calls=0;
 try{
  JSON.parse=(...args)=>{calls++;return parse(...args);};
  const members=readCompanions(data);for(let i=0;i<200;i++)assert.equal(readCompanions(data),members);
  assert.equal(calls,1);raw.Animals[0].Name='Neuer Name';data.sourceJSON=JSON.stringify(raw);
  assert.equal(readCompanions(data)[0].Name,'Neuer Name');assert.equal(calls,2);
  data.localState={version:1};data.retinue=[{Name:'Lokaler Stand'}];assert.equal(readCompanions(data)[0].Name,'Lokaler Stand');assert.equal(calls,2);
 }finally{JSON.parse=parse;}
});
test('Full 1.8 state retains only actual differences when the source is updated',()=>{
 const raw=retinueFixture();raw.CurrentAE=7;raw.DerivedValues.push({ShortName:'AE',TotalValue:20});raw.ComplexConditions=[{Name:'Benommen',Level:0,Suppression:0}];
 const before=snapshot(raw),conditions=conditionRows(before);conditions.complex.find(row=>row.Name==='Schmerz').Level=1;
 const legacy=withPlayState(before,{version:1,conditions,resources:{root:{LE:12,AE:7},[memberStateKey(readCompanions(before)[0])]:{LE:14}}});
 const compact=compactLocalState(legacy,legacy.localState);
 assert.deepEqual(compact.resources,{root:{LE:12}});assert.deepEqual(compact.conditions.complex.map(row=>row.Name),['Schmerz']);
 raw.CurrentAE=10;raw.Animals[0].CurrentLe=18;raw.ComplexConditions[0].Level=1;
 const after=retainPlayState(legacy,snapshot(raw));
 assert.equal(after.resources.find(row=>row.name==='LE').value,12);assert.equal(after.resources.find(row=>row.name==='AE').value,10);
 assert.equal(readCompanions(after)[0].CurrentLe,18);assert.equal(after.conditions.complex.find(row=>row.name==='Benommen').level,1);
 assert.equal(after.conditions.complex.find(row=>row.name==='Schmerz').level,1);
});
test('A changed condition merges with new source conditions and source aliases without losing data',()=>{
 const raw=retinueFixture();raw.ComplexConditions=[{Name:'Laehmung',Level:1,Suppression:'OneLevel'},{Name:'Schmerz',Level:0}];raw.SimpleConditions=[{Name:'Eigener Zustand',IsActive:true}];
 const data=snapshot(raw),rows=conditionRows(data);assert.equal(rows.complex.filter(row=>/Lähmung|Laehmung/.test(row.Name)).length,1);
 const next=withPlayState(data,{version:1,conditions:{simple:[],complex:[{Name:'Schmerz',Level:1,Suppression:0}]}});
 assert.equal(next.conditions.simple.find(row=>row.name==='Eigener Zustand').active,true);assert.equal(next.conditions.complex.find(row=>row.name==='Laehmung').level,0);
 assert.equal(JSON.parse(next.sourceJSON).SimpleConditions[0].Name,'Eigener Zustand');
});
test('Changing one duplicate condition is rejected before ambiguous merging',()=>{
 const raw=retinueFixture();raw.ComplexConditions=[{Name:'Schmerz',Level:0},{Name:'Schmerz',Level:1}];
 assert.throws(()=>withPlayState(snapshot(raw),{version:1,conditions:{simple:[],complex:[{Name:'Schmerz',Level:2,Suppression:0}]}}),/mehrfach/);
});
test('Compaction keeps unknown orphan energies and uses the retained baseline after companions are omitted',()=>{
 const data=snapshot(retinueFixture()),key=memberStateKey(readCompanions(data)[0]),changed=withPlayState(data,{version:1,resources:{[key]:{LE:3}}});
 const raw=retinueFixture();raw.Animals=[];const omitted=retainPlayState(changed,withCompanionImport(changed,snapshot(raw),false));
 assert.equal(compactLocalState(omitted,{version:1,resources:{[key]:{LE:14}}}).resources,undefined);
 const orphanKey=JSON.stringify(['id','missing']);assert.deepEqual(compactLocalState(data,{version:1,resources:{[orphanKey]:{LE:9}}}).resources,{[orphanKey]:{LE:9}});
});
test('NPC resource compaction preserves their separate model and removes only matching original values',()=>{
 const data=snapshot(npcFixture()),clean=compactLocalState(data,{version:1,resources:{root:{LE:12,AE:10}}});
 assert.deepEqual(clean.resources,{root:{LE:12}});assert.equal(conditionRows(data),null);
});
test('Suppression-only overrides do not freeze a source condition level or active flag',()=>{
 const raw=retinueFixture();raw.ComplexConditions=[{Name:'Schmerz',Level:1,Suppression:0}];raw.SimpleConditions=[{Name:'Reue',IsActive:false,IsSuppressed:false}];
 const before=snapshot(raw),local=withPlayState(before,{version:1,conditions:{simple:[{Name:'Reue',IsActive:false,IsSuppressed:true}],complex:[{Name:'Schmerz',Level:1,Suppression:1}]}});
 const compact=compactLocalState(local,local.localState);
 assert.deepEqual(compact.conditions.simple,[{Name:'Reue',IsSuppressed:true}]);assert.deepEqual(compact.conditions.complex,[{Name:'Schmerz',Suppression:1}]);
 raw.ComplexConditions[0].Level=3;raw.SimpleConditions[0].IsActive=true;
 const next=retainPlayState(local,snapshot(raw)),rows=conditionRows(next);
 assert.equal(rows.complex.find(row=>row.Name==='Schmerz').Level,3);assert.equal(rows.complex.find(row=>row.Name==='Schmerz').Suppression,1);
 assert.equal(rows.simple.find(row=>row.Name==='Reue').IsActive,true);assert.equal(rows.simple.find(row=>row.Name==='Reue').IsSuppressed,true);
});
