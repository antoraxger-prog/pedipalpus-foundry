import { parseCharacter,RETINUE_FORMAT } from './data.js';
import { NPC_FORMAT } from './npc.js';
import { COMPANION_GROUPS,readCompanions } from './retinue.js';

export function retinueSourceJSON(json){
 const character=parseCharacter(json);
 if(character.sourceFormat===RETINUE_FORMAT)return json;
 const members=readCompanions(character);
 if(!members.length)throw new Error('In dieser Datei ist kein Gefolge gespeichert. Bitte einen Charakter, NSC oder eine Gefolgsdatei mit Begleitern auswählen.');
 const raw={Format:RETINUE_FORMAT,Version:1,Name:(members.length===1?members[0].Name:`Gefolge – ${character.profile.name}`).slice(0,120),...(character.sourceFormat===NPC_FORMAT?{NpcRules:true}:{})};
 if(members.length===1&&members[0].PortraitFileName)raw.PortraitFileName=members[0].PortraitFileName;
 const ids=new Set();
 for(const [collection,group]of COMPANION_GROUPS){
  const rows=members.filter(member=>member._group===group).map(member=>{
   const {_collection,_group,_index,...row}=member;
   const clean=value=>String(value??'').normalize('NFC').trim().toLocaleLowerCase('de');
   row.InventoryId=String(row.InventoryId??'').trim()||`legacy:${JSON.stringify([group,clean(row.Name),clean(row.Species)])}`;
   if(ids.has(row.InventoryId))throw new Error('Das Gefolge ist nicht eindeutig zugeordnet. Bitte eindeutige Begleiterkennungen oder Namen in Pedipalpus speichern.');
   ids.add(row.InventoryId);return row;
  });
  if(rows.length)raw[collection]=rows;
 }
 const result=JSON.stringify(raw);parseCharacter(result);return result;
}
