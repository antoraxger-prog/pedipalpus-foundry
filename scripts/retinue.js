export const COMPANION_GROUPS = [['Animals','animals','Tiere'],['Demons','demons','Dämonen'],['Undead','undead','Untote'],['Chimeras','chimeras','Chimären'],['Persons','persons','Personen'],['Elementals','elementals','Elementare'],['Golems','golems','Golems']];
export const COMPANION_ATTRIBUTES = [['MU','Mut'],['KL','Klugheit'],['IN','Intuition'],['CH','Charisma'],['FF','Fingerfertigkeit'],['GE','Gewandtheit'],['KO','Konstitution'],['KK','Körperkraft']];
export const objects = value => Array.isArray(value) ? value.filter(item=>item && typeof item==='object' && !Array.isArray(item)) : [];
export const isCompanionCheck = check => COMPANION_GROUPS.some(([_collection,group])=>check?.id?.startsWith(`${group}:`));
export function retinueEntries(raw){
 return COMPANION_GROUPS.flatMap(([collection,group])=>objects(raw?.[collection]).map((member,index)=>({...member,_collection:collection,_group:group,_index:index})));
}
export function readCompanions(character){
 if(character?.sourceFormat==='Pedipalpus.Npc'&&Array.isArray(character.retinue))return character.retinue;
 try{return retinueEntries(JSON.parse(character.sourceJSON.replace(/^\uFEFF/,'')));}catch{}
 if(Array.isArray(character?.retinue))return character.retinue;
 return (character?.equipment??[]).flatMap(item=>{
  const type=COMPANION_GROUPS.find(([collection])=>item.id?.startsWith(`${collection}:`));
  return type?[{Name:item.name,Species:item.species,InventoryId:item.inventoryId,CurrentLe:item.currentLE,MaxLe:item.maxLE,_collection:type[0],_group:type[1],_index:Number(item.id.split(':')[1])}]:[];
 });
}
export const memberAttributes = member => COMPANION_ATTRIBUTES.flatMap(([short,name])=>Number.isSafeInteger(member?.[short])?[{short,name,value:member[short]}]:[]);
export function companionProbes(raw,{npcRules=false}={}){
 const result=[];
 for(const member of retinueEntries(raw)){
  const prefix=`${member._group}:${member._index}`,attrs=memberAttributes(member);
  const extra={companionGroup:member._group,companionIndex:member._index,companionId:String(member.InventoryId??''),companionName:String(member.Name??'')};
  const add=(suffix,label,value,attributes,kind='skill',ability=null)=>{
   const name=`${member.Name} – ${label}`,needsAttributes=Boolean(ability)&&attributes.length!==3;
   const reason=!Number.isSafeInteger(value)?'Der Probenwert fehlt.':/[|\r\n]/.test(name)||name.length>160?'Der Probenname ist ungültig.':kind==='skill'&&!needsAttributes&&attributes.length!==3?'Die Probenattribute fehlen.':needsAttributes&&!attrs.length?'Die Attribute dieses Wesens fehlen.':'';
   result.push({id:`${prefix}:${suffix}`,name,group:String(member.Name??''),category:`${member._group}-${suffix.split(':')[0]}`,kind,value,attributes,reason,...extra,...(npcRules?{npcRules:true}:{}),...(ability?{companionAbility:ability,needsAttributes}:{} )});
  };
  for(const attr of attrs)add(`attribute:${attr.short}`,attr.name,attr.value,[],'attribute');
  for(const [field,label,keys] of [['MentalMagicResistance','Geistige Magieresistenz',['MU','KL','IN']],['PhysicalMagicResistance','Körperliche Magieresistenz',['GE','KO','KK']]]){
   if(Number.isSafeInteger(member[field]))add(`resistance:${field}`,label,member[field],keys.flatMap(key=>attrs.filter(attr=>attr.short===key)),'skill',npcRules?{collection:'Resistance',index:0,name:label,keys}:null);
  }
  for(const [collection,type] of [['MundaneAbilities','mundane'],['MagicalAbilities','magical']])objects(member[collection]).forEach((ability,index)=>{
   const keys=[ability.FirstAttribute,ability.SecondAttribute,ability.ThirdAttribute];
   const chosen=keys.map(key=>attrs.find(attr=>attr.short===key));
   add(`${type}:${index}`,String(ability.Name??'Fähigkeit'),ability.Value,chosen.every(Boolean)?chosen:[],'skill',{collection,index,keys:chosen.every(Boolean)?keys:[],name:String(ability.Name??'Fähigkeit')});
  });
 }
 return result;
}
export function withCompanionAttributes(character,checkId,keys){
 const check=character?.checks?.find(check=>check.id===checkId);
 if(!check?.companionAbility||!Array.isArray(keys)||keys.length!==3)throw new Error('Diese Gefolgsprobe ist nicht mehr vorhanden.');
 const member=readCompanions(character).find(member=>member._group===check.companionGroup&&member._index===check.companionIndex);
 if(!member||String(member.InventoryId??'')!==check.companionId)throw new Error('Das Gefolgsmitglied wurde inzwischen geändert.');
 const attributes=keys.map(key=>memberAttributes(member).find(attr=>attr.short===key));
 if(attributes.some(attr=>!attr))throw new Error('Bitte drei vorhandene Attribute dieses Wesens auswählen.');
 if(check.npcRules&&new Set(keys).size<2)throw new Error('Alle drei Attribute dürfen bei NSC-Proben nicht gleich sein.');
 const replacement={...check,attributes,needsAttributes:false,companionAbility:{...check.companionAbility,keys:[...keys]}};
 let sourceJSON=character.sourceJSON;
 if(sourceJSON&&character.sourceFormat!=='Pedipalpus.Npc'){
  const raw=JSON.parse(sourceJSON.replace(/^\uFEFF/,'')),source=objects(raw[member._collection])[member._index],ability=objects(source?.[check.companionAbility.collection])[check.companionAbility.index];
  if(!ability||String(ability.Name??'Fähigkeit')!==check.companionAbility.name)throw new Error('Die Fähigkeit wurde inzwischen geändert.');
  [ability.FirstAttribute,ability.SecondAttribute,ability.ThirdAttribute]=keys;
  sourceJSON=JSON.stringify(raw);
 }
 return {...character,...(sourceJSON?{sourceJSON}:{}),checks:character.checks.map(entry=>entry.id===checkId?replacement:entry)};
}

export function retainCompanionChoices(previous,next){
 const identity=check=>JSON.stringify([check.companionGroup,check.companionId||check.companionName,check.companionAbility?.collection,check.companionAbility?.name]);
 for(const check of next.checks??[]){
  if(!check.companionAbility||!check.needsAttributes||(next.checks??[]).filter(entry=>entry.companionAbility&&identity(entry)===identity(check)).length!==1)continue;
  const matches=(previous?.checks??[]).filter(old=>old.companionAbility&&identity(old)===identity(check)&&old.companionAbility.keys?.length===3);
  if(matches.length===1){try{next=withCompanionAttributes(next,check.id,matches[0].companionAbility.keys);}catch{}}
 }
 return next;
}
