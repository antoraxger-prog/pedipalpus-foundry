const rows=value=>Array.isArray(value)?value:[];
const scalar=value=>typeof value==='string'?value.trim().slice(0,2000):typeof value==='number'&&Number.isFinite(value)?String(value):'';
const details=[['Description','Beschreibung'],['Rules','Regeln'],['Cost','Kosten'],['Costs','Kosten'],['AstralCost','AE'],['KarmaCost','KE'],['Duration','Dauer'],['CastingTime','Zauberdauer'],['Range','Reichweite'],['EffectDuration','Wirkungsdauer'],['Notes','Hinweise'],['SpecialEffects','Besonderheiten']];
export function attachCheckDetails(raw,checks){
 return checks.map(check=>{
  const parts=check.id.split(':');let source;
  if(raw.Npc&&!check.companionGroup){
   if(parts[0]==='NpcAbilities')source=rows(raw.Npc.Abilities)[Number(parts[1])];
   else if(parts[0]==='NpcFeatures')source=rows(raw.Npc.Features)[Number(parts[1])];
   else if(['Spells','Rituals','Miracles'].includes(parts[0]))source=rows(raw.Npc.Powers).filter(power=>{const kind=power.Kind??'Zauber';return (kind==='Liturgie'?'Miracles':kind==='Ritual'||kind==='Ritus'?'Rituals':'Spells')===parts[0];})[Number(parts[1])];
  }
  else if(parts[0]==='combat')source=rows(raw[parts[1]])[Number(parts[2])];
  else if(check.companionGroup){const collection={animals:'Animals',demons:'Demons',undead:'Undead',chimeras:'Chimeras',persons:'Persons',elementals:'Elementals',golems:'Golems'}[check.companionGroup],member=rows(raw[collection])[check.companionIndex];source=check.kind==='combat'?rows(member?.Attacks)[Number(parts[2])]:check.companionAbility?rows(member?.[check.companionAbility.collection])[check.companionAbility.index]:null;}
  else {source=rows(raw[parts[0]])[Number(parts[1])];if(parts.length===3)source=rows(source?.Subskills)[Number(parts[2])];}
  if(!source)return check;
  const info=details.flatMap(([key,label])=>scalar(source[key])?[{label,text:scalar(source[key])}]:[]);
  let damage='';
  if(check.kind==='combat'&&check.combat.type!=='parry'){
   damage=scalar(source.DamageExpression)||scalar(source.Damage);
   if(!damage&&Number.isSafeInteger(source.DamageDiceCount)&&Number.isSafeInteger(source.DamageDiceSides)&&Number.isSafeInteger(source.DamageBonus))damage=source.DamageDiceCount>0?`${source.DamageDiceCount}W${source.DamageDiceSides}${source.DamageBonus<0?'':'+'}${source.DamageBonus}`:String(source.DamageBonus);
  }
  return {...check,...(info.length?{info}:{}),...(damage?{damage}:{})};
 });
}
export function damageFormula(value){
 if(typeof value!=='string'||value.length>160)return null;
 const formula=value.replace(/\s+/g,'').replace(/[wW]/g,'d').replace(/D/g,'d').replace(/−/g,'-');
 if(!/^[+-]?(?:\d+d\d+|\d+)(?:[+-](?:\d+d\d+|\d+))*$/.test(formula))return null;
 const terms=formula.match(/[+-]?(?:\d+d\d+|\d+)/g);let dice=0;
 for(const term of terms){if(term.includes('d')){const [count,sides]=term.replace(/^[+-]/,'').split('d').map(Number);if(count<1||count>100||sides<2||sides>1000)return null;dice+=count;}else if(Math.abs(Number(term))>100000)return null;}
 return dice<=100?formula:null;
}
export async function rollDamage(actor,check,token=null,{blind=false,verify=()=>{}}={}){
 if(!actor?.isOwner)throw new Error('Zum Würfeln werden Besitzerrechte benötigt.');
 if(check?.reason)throw new Error(check.reason);
 const verifyToken=()=>{if(token&&(!token.actorLink||token.actorId!==actor.id||token.parent?.tokens?.get&&token.parent.tokens.get(token.id)!==token))throw new Error('Der Token gehört nicht mehr zu diesem Charakter oder wurde entfernt.');};
 verifyToken();
 const formula=damageFormula(check?.damage);if(!formula)throw new Error('Die Schadensformel ist nicht eindeutig würfelbar.');
 const speaker=token?foundry.documents.ChatMessage.getSpeaker({actor,token,scene:token.parent}):{actor:actor.id,alias:actor.name};
 const roll=new foundry.dice.Roll(formula);await roll.evaluate();
 if(!actor.isOwner)throw new Error('Zum Würfeln werden Besitzerrechte benötigt.');
 verifyToken();
 verify();
 return roll.toMessage({speaker,flavor:`Schaden: ${String(check.combat?.weaponName??check.name).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]))}`},{messageMode:blind?'blind':undefined});
}
