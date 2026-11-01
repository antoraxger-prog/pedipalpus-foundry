import {normalizeCharacter,RETINUE_FORMAT} from './data.js';
import {COMPANION_GROUPS,readCompanions,retainCompanionChoices,retainCompanionImport} from './retinue.js';
import {retainNpcChoices} from './npc.js';
import {characterFocus,withFocus} from './combat.js';

export const SIMPLE_STATES=['Blutrausch','Reue'];
export const COMPLEX_STATES=['Schmerz','Benommen','Lähmung','Wut','Überanstrengung'];
const copy=value=>structuredClone(value);
const conditionKey=value=>String(value??'').normalize('NFC').toLocaleLowerCase('de').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss');
const suppression=value=>typeof value==='string'?({None:0,All:1,OneLevel:2,TwoLevels:3})[value]??0:value??0;
function mergeConditions(original=[],overrides=[]){
 const result=copy(Array.isArray(original)?original:[]);
 for(const row of overrides){
  const key=conditionKey(row.Name),matches=result.map((entry,index)=>conditionKey(entry.Name)===key?index:-1).filter(index=>index>=0);
  if(matches.length>1)throw new Error(`Der Zustand „${row.Name}“ ist mehrfach vorhanden. Bitte die Quelldatei prüfen.`);
  if(matches.length)result[matches[0]]={...result[matches[0]],...row,Name:result[matches[0]].Name};else result.push(copy(row));
 }
 return result;
}
export function memberStateKey(member){
 return JSON.stringify([member.InventoryId?'id':member._group,String(member.InventoryId||member.Name||'').normalize('NFC').trim()]);
}
export function stateResources(character){
 const entries=[{key:'root',name:character.profile.name,resources:character.resources??[]}];
 const members=readCompanions(character),counts=new Map();for(const member of members){const key=memberStateKey(member);counts.set(key,(counts.get(key)??0)+1);}
 if(!character.profile.companionGroup)for(const member of members){
  const key=memberStateKey(member);
  if(counts.get(key)!==1)continue;
  entries.push({key,name:member.Name,resources:[{name:'LE',value:member.CurrentLe,max:member.MaxLe},{name:'AE',value:member.CurrentAstralEnergy,max:member.AstralEnergy},{name:'KE',value:member.CurrentKarmaEnergy,max:member.KarmaEnergy}]});
 }
 return entries.map(entry=>({...entry,resources:entry.resources.filter(row=>Number.isFinite(row.value)&&Number.isFinite(row.max)&&(row.name==='LE'||row.max>0))})).filter(entry=>entry.resources.length);
}
export function validateLocalState(state={}){
 if(!state||typeof state!=='object'||Array.isArray(state))throw new Error('Der Spielstand ist ungültig.');
 const result={version:1};
 if(state.conditions){
  const {simple=[],complex=[]}=state.conditions;
  if(!Array.isArray(simple)||!Array.isArray(complex)||simple.length>100||complex.length>100)throw new Error('Die Zustandsliste ist ungültig.');
  result.conditions={simple:simple.map(row=>{
   if(typeof row.Name!=='string'||row.Name.length>100||['IsActive','IsSuppressed'].some(key=>Object.hasOwn(row,key)&&typeof row[key]!=='boolean'))throw new Error('Ein Zustand ist ungültig.');
   return {Name:row.Name,...(Object.hasOwn(row,'IsActive')?{IsActive:row.IsActive}:{}),...(Object.hasOwn(row,'IsSuppressed')?{IsSuppressed:row.IsSuppressed}:{})};
  }),complex:complex.map(row=>{
   if(typeof row.Name!=='string'||row.Name.length>100||Object.hasOwn(row,'Level')&&(!Number.isSafeInteger(row.Level)||row.Level<0||row.Level>4)||Object.hasOwn(row,'Suppression')&&![0,1,2,3].includes(row.Suppression))throw new Error('Eine Zustandsstufe ist ungültig.');
   return {Name:row.Name,...(Object.hasOwn(row,'Level')?{Level:row.Level}:{}),...(Object.hasOwn(row,'Suppression')?{Suppression:row.Suppression}:{})};
  })};
 }
 if(state.resources){
  if(typeof state.resources!=='object'||Array.isArray(state.resources)||Object.keys(state.resources).length>201)throw new Error('Die Energieliste ist ungültig.');
  result.resources={};
  for(const [key,values] of Object.entries(state.resources)){
   if(key!=='root'){let identity;try{identity=JSON.parse(key);}catch{}if(!Array.isArray(identity)||identity.length!==2||identity[0]!=='id'&&!COMPANION_GROUPS.some(([,group])=>group===identity[0])||typeof identity[1]!=='string'||!identity[1]||identity[1].length>160)throw new Error('Die Gefolgszuordnung ist ungültig.');}
   if(!values||typeof values!=='object'||Array.isArray(values))throw new Error('Ein Energiewert ist ungültig.');
   result.resources[key]={};
   for(const [name,value] of Object.entries(values)){
    if(!['LE','AE','KE'].includes(name)||!Number.isSafeInteger(value)||Math.abs(value)>100000)throw new Error('Bitte ganze Energiewerte bis 100.000 eingeben.');
    result.resources[key][name]=value;
   }
  }
 }
 if(state.offHand!==undefined){if(typeof state.offHand!=='string'||state.offHand.length>160)throw new Error('Die Nebenhand ist ungültig.');result.offHand=state.offHand;}
 return result;
}
export function conditionRows(character){
 let raw;try{raw=JSON.parse(character.sourceJSON.replace(/^\uFEFF/,''));}catch{return null;}
 if(raw.Format||character.profile.companionGroup||character.profile.retinueOnly)return null;
 const saved=character.localState?.conditions;
 const simple=mergeConditions(raw.SimpleConditions,saved?.simple),complex=mergeConditions(raw.ComplexConditions,saved?.complex);
 for(const name of SIMPLE_STATES)if(!simple.some(row=>conditionKey(row.Name)===conditionKey(name)))simple.push({Name:name,IsActive:false,IsSuppressed:false});
 for(const name of COMPLEX_STATES)if(!complex.some(row=>conditionKey(row.Name)===conditionKey(name)))complex.push({Name:name,Level:0,Suppression:0});
 return {simple:simple.map(row=>({Name:row.Name,IsActive:row.IsActive===true,IsSuppressed:row.IsSuppressed===true})),complex:complex.map(row=>({Name:row.Name,Level:row.Level??0,Suppression:suppression(row.Suppression)}))};
}
export function compactLocalState(character,state){
 const clean=validateLocalState(state);
 if(typeof character.sourceJSON!=='string')return clean;
 const raw=JSON.parse(character.sourceJSON.replace(/^\uFEFF/,''));
 if(clean.conditions){
  const one=(name,rows)=>{const matches=(Array.isArray(rows)?rows:[]).filter(row=>conditionKey(row.Name)===conditionKey(name));return matches.length<=1?matches[0]??{}:null;};
  clean.conditions.simple=clean.conditions.simple.map(row=>{const original=one(row.Name,raw.SimpleConditions),patch={Name:row.Name};for(const key of ['IsActive','IsSuppressed'])if(Object.hasOwn(row,key)&&(original===null||row[key]!==(original[key]===true)))patch[key]=row[key];return patch;}).filter(row=>Object.keys(row).length>1);
  clean.conditions.complex=clean.conditions.complex.map(row=>{const original=one(row.Name,raw.ComplexConditions),patch={Name:row.Name};for(const key of ['Level','Suppression'])if(Object.hasOwn(row,key)&&(original===null||row[key]!==(key==='Level'?original.Level??0:suppression(original.Suppression))))patch[key]=row[key];return patch;}).filter(row=>Object.keys(row).length>1);
 }
 if(clean.resources){
  const original=normalizeCharacter(raw,character.importedAt),baseline=new Map(stateResources(original).map(entry=>[entry.key,Object.fromEntries(entry.resources.map(row=>[row.name,row.value]))]));
  for(const [key,values] of Object.entries(clean.resources)){
   const before=character.retinueImportEnabled===false&&key!=='root'?character.localStateBase?.resources?.[key]:baseline.get(key);
   for(const [name,value] of Object.entries(values))if(before&&Object.hasOwn(before,name)&&before[name]===value)delete values[name];
   if(!Object.keys(values).length)delete clean.resources[key];
  }
  if(!Object.keys(clean.resources).length)delete clean.resources;
 }
 if(clean.offHand!==undefined&&clean.offHand===(raw.ActiveOffHandWeaponId??''))delete clean.offHand;
 return clean;
}
export function withPlayState(character,state){
 const clean=validateLocalState(state);
 if(typeof character.sourceJSON!=='string')throw new Error('Bitte den Charakter einmal erneut importieren, bevor du den Spielstand änderst.');
 const raw=JSON.parse(character.sourceJSON.replace(/^\uFEFF/,'')),npc=raw.Format==='Pedipalpus.Npc';
 if(character.profile.companionGroup&&!character.profile.retinueOnly)throw new Error('Verknüpfte Begleiter über ihren Hauptcharakter bearbeiten.');
 const rootValues=clean.resources?.root;
 if(rootValues){
  for(const [name,value] of Object.entries(rootValues)){
   if(npc)raw.Npc[{LE:'CurrentLe',AE:'CurrentAe',KE:'CurrentKe'}[name]]=value;
   else if(raw.Format!==RETINUE_FORMAT)raw[`Current${name}`]=value;
  }
 }
 if(clean.conditions){
  if(npc||raw.Format===RETINUE_FORMAT)throw new Error('Automatische Zustandsänderungen werden für Pedipalpus-Charaktere unterstützt.');
  raw.SimpleConditions=mergeConditions(raw.SimpleConditions,clean.conditions.simple);raw.ComplexConditions=mergeConditions(raw.ComplexConditions,clean.conditions.complex);
  const visit=(value,depth=0)=>{
   if(!value||typeof value!=='object')return;
   if(depth>64)throw new Error('Die Attributstruktur ist zu tief verschachtelt.');
   if(['MU','KL','IN','CH','FF','GE','KO','KK','gMR','kMR','RE'].includes(value.ShortName)){
    if(!Number.isSafeInteger(value.BaseValue)||!Number.isSafeInteger(value.ModValue)){
     if(!Number.isSafeInteger(value.TotalValue))throw new Error('Die Attributsbasis fehlt. Bitte erneut importieren.');
     value.BaseValue=value.TotalValue;value.ModValue=0;
    }
    delete value.TotalValue;
   }
   for(const child of Object.values(value))visit(child,depth+1);
  };visit(raw);
 }
 if(clean.offHand!==undefined){
  if(npc||raw.Format===RETINUE_FORMAT)throw new Error('Diese Nebenhandregel gehört zum Pedipalpus-Charakter.');
  if(clean.offHand&&(raw.ParryWeapons??[]).filter(row=>row.InventoryItemId===clean.offHand).length!==1)throw new Error('Die ausgewählte Nebenhand fehlt oder ist mehrdeutig.');
  raw.ActiveOffHandWeaponId=clean.offHand;
  // Aktuelle Nebenhandregeln auch bei älteren vollständigen Attributsspeicherständen verwenden.
  for(const attr of raw.PrimaryAttributes??[]){if(!Number.isSafeInteger(attr.BaseValue)||!Number.isSafeInteger(attr.ModValue)){attr.BaseValue=attr.TotalValue;attr.ModValue=0;}delete attr.TotalValue;}
 }
 let next={...normalizeCharacter(raw,character.importedAt),sourceJSON:character.sourceJSON};
 next=retainCompanionImport(character,retainNpcChoices(character,retainCompanionChoices(character,next)));
 // Energien des Gefolges betreffen nur den aktuellen Foundry-Stand, unabhängig vom Quellenformat.
 const members=copy(readCompanions(next));
 const baseline={};
 for(const member of members){
  const key=memberStateKey(member),old=character.retinueImportEnabled===false?character.localStateBase?.resources?.[key]:null;
  if(old&&members.filter(row=>memberStateKey(row)===key).length===1)for(const [name,value] of Object.entries(old))member[{LE:'CurrentLe',AE:'CurrentAstralEnergy',KE:'CurrentKarmaEnergy'}[name]]=value;
  baseline[key]=Object.fromEntries([['LE',member.CurrentLe],['AE',member.CurrentAstralEnergy],['KE',member.CurrentKarmaEnergy]].filter(([,value])=>Number.isSafeInteger(value)));
  const values=clean.resources?.[key];
  if(!values||members.filter(row=>memberStateKey(row)===key).length!==1)continue;
  for(const [name,value] of Object.entries(values))member[{LE:'CurrentLe',AE:'CurrentAstralEnergy',KE:'CurrentKarmaEnergy'}[name]]=value;
 }
 next.retinue=members;
 next.equipment=next.equipment.map(item=>{const member=members.find(row=>item.id===`${row._collection}:${row._index}`);return member?{...item,currentLE:member.CurrentLe}:item;});
 // Bei reinem Gefolge ist die einzelne Figur selbst die Ressource.
 if(next.profile.retinueOnly&&members.length===1){const member=members[0];if(rootValues)for(const [name,value] of Object.entries(rootValues))member[{LE:'CurrentLe',AE:'CurrentAstralEnergy',KE:'CurrentKarmaEnergy'}[name]]=value;next.resources=next.resources.map(row=>({...row,value:member[{LE:'CurrentLe',AE:'CurrentAstralEnergy',KE:'CurrentKarmaEnergy'}[row.name]]??row.value}));}
 const focus=characterFocus(character);if(focus!==null&&characterFocus(next)!==null)next=withFocus(next,focus);
 return Object.keys(clean).length>1?{...next,localState:clean,localStateBase:{resources:baseline}}:next;
}
export function retainPlayState(previous,next,{conditions=true,resources=true,offHand=true}={}){
 if(!previous?.localState)return next;
 const state=compactLocalState(previous,previous.localState),kept={version:1};
 if(conditions&&state.conditions)kept.conditions=state.conditions;
 if(resources&&state.resources){
  kept.resources=state.resources;
 }
 if(offHand&&state.offHand!==undefined){let raw;try{raw=JSON.parse(next.sourceJSON);}catch{}if(state.offHand===''||(raw?.ParryWeapons??[]).some(row=>row.InventoryItemId===state.offHand))kept.offHand=state.offHand;}
 return Object.keys(kept).length>1?withPlayState(next,kept):next;
}
