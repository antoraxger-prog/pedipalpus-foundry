import { retinueEntries,isCompanionCheck } from './retinue.js';
const list = value => Array.isArray(value) ? value.filter(x => x && typeof x === 'object') : [];
const text = value => typeof value === 'string' ? value.trim() : '';
const integer = value => Number.isSafeInteger(value) ? value : null;
const savedInteger = value => typeof value === 'string' && /^-?\d+$/.test(value.trim()) ? integer(Number(value)) : integer(value);
const comparable = value => text(value).replace(/[äöüÄÖÜß]/g, c => ({ä:'ae',ö:'oe',ü:'ue',Ä:'AE',Ö:'OE',Ü:'UE',ß:'ss'}[c])).toLocaleLowerCase('de');

const validFocus = value => Number.isSafeInteger(value) && value >= -4 && value <= 4;
export function characterFocus(character) {
  if (validFocus(character?.combat?.offDefOffset)) return character.combat.offDefOffset;
  const checks = (character?.checks ?? []).filter(check => check.kind === 'combat' && !isCompanionCheck(check) && !check.fixedCombat && check.combat?.type !== 'ranged');
  const values = checks.map(check => check.combat.type === 'attack' ? check.combat.focusValue : -check.combat.focusValue);
  return values.length && values.every(value => validFocus(value) && value === values[0]) ? values[0] : null;
}

export function withFocus(character, focus) {
  if (!validFocus(focus)) throw new Error('Der Fokus muss eine ganze Zahl zwischen −4 und 4 sein.');
  if (characterFocus(character) === null) throw new Error('Der gespeicherte Fokus ist unvollständig. Bitte die Charakterdatei erneut importieren.');
  return {...character, combat: {...character.combat, offDefOffset: focus, offOffset: focus, defOffset: -focus},
    checks: character.checks.map(check => {
      if (check.kind !== 'combat' || isCompanionCheck(check) || check.fixedCombat || check.combat.type === 'ranged') return check;
      const combat = {...check.combat, focusValue: check.combat.type === 'attack' ? focus : -focus};
      return {...check, combat, value: check.reason ? check.value : combat.skillValue + combat.baseValue + combat.focusValue + combat.weaponModifier - combat.mobilityPenalty};
    })};
}

export function combatChecks(raw,{npcRules=false}={}) {
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
      for (const type of ranged ? ['ranged'] : ['attack','parry']) {
        add(`combat:${key}:${i}:${type}`,text(weapon.Name),text(best?.Name),type,integer(best?.Value),base(type),
          ranged ? 0 : integer(raw[type === 'attack' ? 'OffOffset' : 'DefOffset']),
          integer(weapon[type === 'parry' ? key === 'ParryWeapons' ? 'DefenseBonus' : 'ParryBonus' : 'AttackBonus']),penalty);
      }
    });
  }
  retinueEntries(raw).forEach(animal => list(animal.Attacks).forEach((attack,j) => {
    const i=animal._index,group=animal._group;
    for (const type of attack.IsRanged===true?['ranged']:attack.AttackOnly===true?['attack']:['attack','parry']) add(`${group}:${i}:${j}:${type}`,`${text(animal.Name) || 'Tier'} – ${text(attack.Name) || 'Tierangriff'}`,
      text(attack.Name) || 'Tierangriff',type,integer(attack[type === 'parry' ? 'ParryValue' : 'AttackValue']),0,0,0,0,{...(group==='animals'?{animalName:text(animal.Name)}:{}),companionName:text(animal.Name),companionGroup:group,companionIndex:i,companionId:text(animal.InventoryId),ranges:text(attack.Ranges)});
  }));
  return checks;
}
