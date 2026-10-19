import { normalizeCharacter } from './data.js';
import { characterFocus } from './combat.js';
import { NPC_FORMAT,mapNpcFile,retainNpcChoices } from './npc.js';
import { retainCompanionChoices } from './retinue.js';

const list=value=>Array.isArray(value)?value.filter(item=>item&&typeof item==='object'):[];
const finite=value=>typeof value==='number'&&Number.isFinite(value)?value:0;
const own=item=>!String(item.CarrierAnimalId??'').trim();
const carried=item=>item.OnPerson!==false;
const stack=item=>Math.max(0,finite(item.Weight))*Math.max(0,finite(item.Quantity??1));
export function equipmentSource(character) {
  if(typeof character?.sourceJSON!=='string')throw new Error('Für Ausrüstungsänderungen die Charakterdatei bitte einmal erneut importieren.');
  return JSON.parse(character.sourceJSON.replace(/^\uFEFF/,''));
}
export function armorItems(character) {
  if(character?.sourceFormat===NPC_FORMAT)return (character.equipment??[]).filter(item=>item.id?.startsWith('Armors:')).map(item=>({...item,carried:null}));
  try { return list(equipmentSource(character).Armors).map((item,index)=>({id:`Armors:${index}`,name:String(item.Name??''),armor:item.Protection,penalty:item.MobilityPenalty,basePenalty:item.BaseMobilityPenalty,carried:carried(item),equipped:item.IsEquiped===true,carrierAnimalId:String(item.CarrierAnimalId??'')})); }
  catch { return (character?.equipment??[]).filter(item=>item.id?.startsWith('Armors:')); }
}

// Die Last-/Rüstungsberechnung folgt Pedipalpus RecalculateCarriedWeight und RecalculateImpairment.
export function recalculateArmor(raw) {
  const armors=list(raw.Armors);
  for(const armor of armors)if(!carried(armor)||!own(armor))armor.IsEquiped=false;
  const equipped=armors.filter(armor=>carried(armor)&&own(armor)&&armor.IsEquiped===true);
  if(equipped.some(armor=>!Number.isSafeInteger(armor.BaseMobilityPenalty)))throw new Error('Die Basis-BE fehlt. Bitte den Charakter in Pedipalpus speichern und erneut importieren.');
  const loose=['MeleeWeapons','RangedWeapons','ParryWeapons','Ammunitions','Armors','GeneralItems'].flatMap(key=>list(raw[key]));
  let load=loose.filter(item=>own(item)&&carried(item)).reduce((sum,item)=>sum+stack(item),0);
  for(const container of list(raw.InventoryContainers).filter(item=>own(item)&&carried(item)&&item.IsCarried!==false))load+=Math.max(0,finite(container.Weight))+list(container.Items).filter(carried).reduce((sum,item)=>sum+stack(item),0);
  const capacity=Math.max(0,finite(list(raw.DerivedValues)[8]?.TotalValue));
  const overload=load>capacity*2?3:load>capacity*1.5?2:load>capacity?1:0;
  raw.CarriedWeight=load;raw.CarryCapacity=capacity;
  raw.GRS=equipped.reduce((sum,item)=>sum+Math.max(0,finite(item.Protection)),0);
  raw.Be=equipped.reduce((sum,item)=>sum+item.BaseMobilityPenalty,0)+overload;
  return raw;
}

export function withArmorState(character,id,field,value) {
  if(!/^Armors:\d+$/.test(id??'')||!['carried','equipped'].includes(field)||typeof value!=='boolean')throw new Error('Die Rüstungsauswahl ist ungültig.');
  const raw=equipmentSource(character),index=Number(id.split(':')[1]);
  if(character.sourceFormat===NPC_FORMAT){
    if(field!=='equipped')throw new Error('Das NSC-Format speichert nur Angelegt, keinen Dabei-Zustand.');
    mapNpcFile(raw);
    const armor=raw.Npc.Armors[index];if(!armor)throw new Error('Die Rüstung ist im aktuellen NSC nicht mehr vorhanden.');
    armor.Equipped=value;const focus=characterFocus(character);if(focus!==null)raw.Npc.Focus=focus;
    return retainCompanionChoices(character,retainNpcChoices(character,{...normalizeCharacter(raw,character.importedAt),sourceJSON:JSON.stringify(raw)}));
  }
  const armor=list(raw.Armors)[index];
  if(!armor)throw new Error('Die Rüstung ist im aktuellen Charakter nicht mehr vorhanden.');
  if(field==='equipped'&&value&&!own(armor))throw new Error('Diese Rüstung wird von einem Tier getragen und kann hier nicht angelegt werden.');
  if(field==='carried'){armor.OnPerson=value;if(!value)armor.IsEquiped=false;}
  else{armor.IsEquiped=value;if(value)armor.OnPerson=true;}
  const focus=characterFocus(character);
  if(focus!==null){raw.OffDefOffset=focus;raw.OffOffset=focus;raw.DefOffset=-focus;}
  recalculateArmor(raw);
  return {...normalizeCharacter(raw,character.importedAt),sourceJSON:JSON.stringify(raw)};
}
