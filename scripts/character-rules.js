const rows = value => Array.isArray(value) ? value.filter(row => row && typeof row === 'object') : [];
const ascii = value => String(value ?? '').replace(/[äöüÄÖÜß]/g, c => ({ä:'ae',ö:'oe',ü:'ue',Ä:'AE',Ö:'OE',Ü:'UE',ß:'ss'}[c])).toLowerCase();
const has = (raw, collection, name) => rows(raw[collection]).some(row => ascii(row.Name) === ascii(name));
const scale = level => [0,2,4,8][level];
const small = level => [0,1,2,4][level];
export const currentCharacterRules = raw => rows(raw?.PrimaryAttributes).some(attr => !Object.hasOwn(attr,'TotalValue') && Number.isSafeInteger(attr.BaseValue) && Number.isSafeInteger(attr.ModValue));

export function specialAbilityLevel(raw, name) {
  if(!name)return 0;
  return Math.max(0,...['CombatSpecialSkills','MagicalSpecialSkills','DivineSpecialSkills','MundaneSpecialSkills'].flatMap(key => rows(raw[key])).filter(row => ascii(row.Name).startsWith(ascii(name))).map(row => {
    const romans={I:1,II:2,III:3,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,X:10};
    const matches=String(row.Name ?? '').replace(/\[[^\]]*\]/g,'').match(/(?<![A-Za-z])(X|IX|VIII|VII|VI|IV|V|III|II|I)(?![A-Za-z])/gi);
    return Math.max(1,Number.isSafeInteger(row.Level)?row.Level:0,...(matches??[]).map(value=>romans[value.toUpperCase()]));
  }));
}

export function conditionState(raw) {
  const active = name => rows(raw.SimpleConditions).some(row => ascii(row.Name) === ascii(name) && row.IsActive === true && row.IsSuppressed !== true);
  const level = name => Math.max(0,...rows(raw.ComplexConditions).filter(row=>ascii(row.Name)===ascii(name)).map(row=>{
    const automatic=(ascii(name)===ascii('Schmerz')&&has(raw,'Advantages','Eisern') || ascii(name)===ascii('Überanstrengung')&&has(raw,'Advantages','Ausdauernd'))?1:0;
    const suppression=typeof row.Suppression==='string'?({None:0,All:1,OneLevel:2,TwoLevels:3})[row.Suppression]:row.Suppression;
    return suppression===1?0:Math.max(0,Math.min(3,(Number.isSafeInteger(row.Level)?row.Level:0)-Math.max(automatic,suppression===2?1:suppression===3?2:0)));
  }));
  return {active,level,pain:active('Blutrausch')?0:level('Schmerz')};
}

// Die Datei bleibt unverändert. Summen und vorübergehende Zustände werden nur für die Foundry-Ansicht berechnet.
export function prepareCharacterRules(raw) {
  if(!currentCharacterRules(raw))return raw;
  const result=structuredClone(raw),state=conditionState(raw),modifiers={};
  const add=(keys,value)=>keys.forEach(key=>modifiers[key]=(modifiers[key]??0)+value);
  if(state.active('Reue'))add(['MU','CH'],-2);
  add(['KL','CH','FF','GE'],-small(state.level('Benommen')));
  add(['FF','GE'],-scale(state.level('Lähmung')));
  add(['KL','CH'],-scale(state.level('Wut')));
  const visit=(value,depth=0)=>{
    if(!value||typeof value!=='object')return;
    if(depth>64)throw new Error('Die Attributstruktur ist zu tief verschachtelt.');
    if(['MU','KL','IN','CH','FF','GE','KO','KK','gMR','kMR','RE'].includes(value.ShortName) && Number.isSafeInteger(value.BaseValue) && Number.isSafeInteger(value.ModValue)) {
      value.TotalValue=value.BaseValue+value.ModValue+(value.ShortName==='RE'?-scale(state.level('Überanstrengung')):modifiers[value.ShortName]??0);
    }
    for(const child of Object.values(value))visit(child,depth+1);
  };
  visit(result);
  const gs=rows(result.DerivedValues).find(row=>row.ShortName==='GS');
  if(gs&&typeof gs.TotalValue==='number'){
    let value=gs.TotalValue-small(state.level('Benommen'))-small(state.pain)-state.level('Lähmung')*4;
    if(value>0&&state.level('Überanstrengung')>0)value=Math.max(1,value-scale(state.level('Überanstrengung')));
    result.Gs=String(Math.max(0,value));
  }
  return result;
}

export function applyCharacterCheckRules(raw,checks) {
  const state=conditionState(raw),paralysis=state.level('Lähmung'),dazed=state.level('Benommen');
  return checks.map(check=>{
    if(check.companionGroup || check.reason)return check;
    const combat=check.kind==='combat',type=check.combat?.type;
    let blocked='';
    if(paralysis>0&&Number(raw.Gs)<=0)blocked='Keine Probe möglich: handlungsunfähig durch Lähmung (GS 0).';
    else if(combat&&state.pain===3)blocked='Keine Kampfprobe möglich: handlungsunfähig durch Schmerz III.';
    else if(combat&&['attack','ranged'].includes(type)&&dazed===3)blocked='Keine offensive Kampfprobe möglich: Benommen III.';
    else if(combat&&type==='parry'&&state.active('Blutrausch'))blocked='Keine defensive Kampfprobe möglich: Blutrausch.';
    let value=check.value;
    if(['BodySkills','CraftingSkills'].includes(check.category)&&has(raw,'Disadvantages','Theoretiker'))value=Math.sign(value)*Math.round(Math.abs(value)/2);
    let penalty=scale(state.pain);
    if(combat)penalty+=scale(paralysis)+scale(dazed)+(type==='parry'?scale(state.level('Wut')):0);
    else if((check.kind==='attribute'?[check.name]:check.attributes.map(attr=>attr.name)).some(name=>['fingerfertigkeit','gewandtheit'].includes(ascii(name))))penalty+=scale(paralysis);
    if(combat&&type==='parry'&&has(raw,'Disadvantages','Schlechte Gelenke'))penalty+=2;
    return {...check,value:value-penalty,...(penalty?{rulePenalty:penalty}:{}),...(combat?{combat:{...check.combat,baseValue:check.combat.baseValue-penalty}}:{}),...(blocked?{reason:blocked,ruleBlocked:true}:{})};
  });
}

export function offHandBonus(raw,weapon) {
  const eligible=item=>item?.OnPerson!==false&&!String(item.CarrierAnimalId??'').trim()&&(item.Quantity??1)>0&&ascii(item.Handedness)==='einhaendig';
  if(!eligible(weapon)||['unbewaffnet','waffenlos'].includes(ascii(weapon.Name)))return 0;
  const off=rows(raw.ParryWeapons).find(item=>item.InventoryItemId===raw.ActiveOffHandWeaponId&&eligible(item));
  if(!off)return 0;
  return parryDefense(raw,off);
}

export function parryDefense(raw,weapon) {
  const bonuses=weapon.ParryBonus;
  return Array.isArray(bonuses)&&bonuses.length?bonuses[Math.min(bonuses.length-1,2,specialAbilityLevel(raw,weapon.DefenseTrainingSkill??''))]:weapon.DefenseBonus;
}
