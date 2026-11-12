import { retinueEntries,isCompanionCheck,personValue } from './retinue.js';
import { offHandBonus,parryDefense } from './character-rules.js';
const list = value => Array.isArray(value) ? value.filter(x => x && typeof x === 'object') : [];
const text = value => typeof value === 'string' ? value.trim() : '';
const integer = value => Number.isSafeInteger(value) ? value : null;
const savedInteger = value => typeof value === 'string' && /^-?\d+$/.test(value.trim()) ? integer(Number(value)) : integer(value);
const comparable = value => text(value).replace(/[äöüÄÖÜß]/g, c => ({ä:'ae',ö:'oe',ü:'ue',Ä:'AE',Ö:'OE',Ü:'UE',ß:'ss'}[c])).toLocaleLowerCase('de');

export const COMBAT_FOCUS_LIMIT = 2;
const validFocus = value => Number.isSafeInteger(value) && Math.abs(value) <= COMBAT_FOCUS_LIMIT;
const clampFocus = value => Math.max(-COMBAT_FOCUS_LIMIT, Math.min(COMBAT_FOCUS_LIMIT, value));
const usesFocus = check => check.kind === 'combat' && !isCompanionCheck(check) && !check.fixedCombat
  && (check.combat?.type === 'attack' || check.combat?.type === 'parry');
const focusFor = (check, focus) => check.combat.type === 'attack' ? focus : -focus;

export function characterFocus(character) {
  const stored = character?.combat?.offDefOffset;
  if (Number.isSafeInteger(stored)) return clampFocus(stored);
  const values = (character?.checks ?? []).filter(usesFocus).map(check => focusFor(check, check.combat.focusValue));
  return values.length && values.every(value => Number.isSafeInteger(value) && value === values[0]) ? clampFocus(values[0]) : null;
}

export function withFocus(character, focus) {
  if (!validFocus(focus)) throw new Error('Der Fokus muss eine ganze Zahl zwischen −2 und 2 sein.');
  if (characterFocus(character) === null) throw new Error('Der gespeicherte Fokus ist unvollständig. Bitte die Charakterdatei erneut importieren.');
  return {...character, combat: {...character.combat, offDefOffset: focus, offOffset: focus, defOffset: -focus},
    checks: character.checks.map(check => {
      if (!usesFocus(check)) return check;
      const combat = {...check.combat, focusValue: focusFor(check, focus)};
      return {...check, combat, value: check.reason ? check.value : combat.skillValue + combat.baseValue + combat.focusValue + combat.weaponModifier - combat.mobilityPenalty};
    })};
}

export function normalizeCombatFocus(character) {
  const focus = characterFocus(character);
  if (focus === null) return character;
  const combat = character.combat;
  const exceedsLimit = value => Number.isSafeInteger(value) && !validFocus(value);
  const legacyOffsets = [combat?.offDefOffset, combat?.offOffset, combat?.defOffset];
  return legacyOffsets.some(exceedsLimit) || character.checks.some(check => usesFocus(check) && exceedsLimit(check.combat.focusValue))
    ? withFocus(character, focus)
    : character;
}

export function combatChecks(raw,{npcRules=false,currentRules=false}={}) {
  const checks = [];
  const add = (id, weaponName, skillName, type, skillValue, baseValue, focusValue, weaponModifier, mobilityPenalty, extra = {}) => {
    const values = [skillValue, baseValue, focusValue, weaponModifier, mobilityPenalty];
    const reason = values.some(value => !Number.isSafeInteger(value)) || !skillName || !weaponName
      ? 'Die Kampfwerte sind nicht vollständig gespeichert. Bitte in Pedipalpus speichern und erneut importieren.'
      : /[|\r\n]/.test(weaponName + skillName) ? 'Der Name enthält Zeichen, die für Kampfproben nicht geeignet sind.' : '';
    const label = {attack:'Angriff',parry:'Parade',ranged:'Fernkampf'}[type];
    checks.push({id,kind:'combat',name:`${weaponName} · ${label}`,group:skillName,foundation:skillName,
      attributes:[],reason,value:reason ? null : skillValue + baseValue + focusValue + weaponModifier - mobilityPenalty,
      combat:{type,weaponName,skillName,skillValue,baseValue,focusValue,weaponModifier,mobilityPenalty},...extra});
  };
  for (const key of ['MeleeWeapons','ParryWeapons','RangedWeapons']) {
    const ranged = key === 'RangedWeapons';
    list(raw[key]).forEach((weapon,i) => {
      if(currentRules&&text(weapon.CarrierAnimalId)&&list(raw.Persons).some(person=>person.InventoryId===weapon.CarrierAnimalId))return;
      const allowed = Array.isArray(weapon.UsedSkills) ? weapon.UsedSkills.filter(x => text(x)) : [];
      if (!allowed.length && text(weapon.UsedSkill)) allowed.push(weapon.UsedSkill);
      let best = null;
      for (const name of allowed) {
        const skill = list(raw[ranged ? 'RangedSkills' : 'MeleeSkills']).find(x => comparable(x.Name) === comparable(name));
        if (integer(skill?.Value) !== null && (!best || skill.Value > best.Value)) best = skill;
      }
      const penalty = Number.isSafeInteger(raw.Be) && (ranged&&!npcRules || Number.isSafeInteger(weapon.MobilityTolerance))
        ? Math.max(0, raw.Be - (ranged&&!npcRules ? 2 : weapon.MobilityTolerance)) : null;
      const base = type => savedInteger(raw[type === 'attack' ? 'Off' : type === 'parry' ? 'Def' : 'Fk']);
      // Der NSC-Generator verwendet ohne passende Kampftechnik ausdrücklich Talentwert 0.
      for (const type of ranged ? ['ranged'] : ['attack','parry']) {
        add(`combat:${key}:${i}:${type}`,text(weapon.Name),best?text(best.Name):npcRules?'Ohne Kampftechnik':'',type,best?integer(best.Value):npcRules?0:null,base(type),
          ranged ? 0 : integer(raw[type === 'attack' ? 'OffOffset' : 'DefOffset']),
          type==='parry'&&key==='MeleeWeapons'&&currentRules&&integer(weapon.ParryBonus)!==null
            ? weapon.ParryBonus+offHandBonus(raw,weapon)
            : type==='parry'&&key==='ParryWeapons'&&currentRules?integer(parryDefense(raw,weapon))
            : integer(weapon[type === 'parry' ? key === 'ParryWeapons' ? 'DefenseBonus' : 'ParryBonus' : 'AttackBonus']),penalty);
      }
    });
  }
  retinueEntries(raw).forEach(animal => list(animal.Attacks).forEach((attack,j) => {
    const i=animal._index,group=animal._group;
    for (const type of attack.IsRanged===true?['ranged']:attack.AttackOnly===true?['attack']:['attack','parry']) add(`${group}:${i}:${j}:${type}`,`${text(animal.Name) || 'Tier'} – ${text(attack.Name) || 'Tierangriff'}`,
      text(attack.Name) || 'Tierangriff',type,integer(attack[type === 'parry' ? 'ParryValue' : 'AttackValue']),0,0,0,0,{...(group==='animals'?{animalName:text(animal.Name)}:{}),companionName:text(animal.Name),companionGroup:group,companionIndex:i,companionId:text(animal.InventoryId),ranges:text(attack.Ranges)});
  }));
  retinueEntries(raw).filter(member=>member._group==='persons'&&personValue(member,'AW')!==null).forEach(member=>{
    add(`persons:${member._index}:dodge:parry`,`${text(member.Name)} – Ausweichen`,'Ausweichen','parry',personValue(member,'AW'),0,0,0,0,
      {fixedCombat:true,companionName:text(member.Name),companionGroup:'persons',companionIndex:member._index,companionId:text(member.InventoryId)});
  });
  return checks;
}
