const list = value => Array.isArray(value) ? value.filter(x => x && typeof x === 'object') : [];
const text = value => typeof value === 'string' ? value.trim() : '';
const integer = value => Number.isSafeInteger(value) ? value : null;
const savedInteger = value => typeof value === 'string' && /^-?\d+$/.test(value.trim()) ? integer(Number(value)) : integer(value);
const comparable = value => text(value).replace(/[äöüÄÖÜß]/g, c => ({ä:'ae',ö:'oe',ü:'ue',Ä:'AE',Ö:'OE',Ü:'UE',ß:'ss'}[c])).toLocaleLowerCase('de');

export function combatChecks(raw) {
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
      const penalty = Number.isSafeInteger(raw.Be) && (ranged || Number.isSafeInteger(weapon.MobilityTolerance))
        ? Math.max(0, raw.Be - (ranged ? 2 : weapon.MobilityTolerance)) : null;
      const base = type => savedInteger(raw[type === 'attack' ? 'Off' : type === 'parry' ? 'Def' : 'Fk']);
      for (const type of ranged ? ['ranged'] : ['attack','parry']) {
        add(`combat:${key}:${i}:${type}`,text(weapon.Name),text(best?.Name),type,integer(best?.Value),base(type),
          ranged ? 0 : integer(raw[type === 'attack' ? 'OffOffset' : 'DefOffset']),
          integer(weapon[type === 'parry' ? key === 'ParryWeapons' ? 'DefenseBonus' : 'ParryBonus' : 'AttackBonus']),penalty);
      }
    });
  }
  list(raw.Animals).forEach((animal,i) => list(animal.Attacks).forEach((attack,j) => {
    for (const type of ['attack','parry']) add(`animals:${i}:${j}:${type}`,`${text(animal.Name) || 'Tier'} – ${text(attack.Name) || 'Tierangriff'}`,
      text(attack.Name) || 'Tierangriff',type,integer(attack[type === 'attack' ? 'AttackValue' : 'ParryValue']),0,0,0,0,{animalName:text(animal.Name)});
  }));
  return checks;
}
