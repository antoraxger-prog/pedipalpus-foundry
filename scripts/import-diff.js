import { checkReference, referenceKey } from './workbench.js';
import { armorItems } from './equipment.js';
import { characterFocus } from './combat.js';

const printable = value => value === null || value === undefined ? '–' : value;
const attributes = check => (check.attributes ?? []).map(att => `${att.name}: ${printable(att.value)}`).join(' · ');
const calculation = check => check.combat ? `${check.combat.skillName}: ${printable(check.combat.skillValue)} · Basis ${printable(check.combat.baseValue)} · Fokus ${printable(check.combat.focusValue)} · Waffenbonus ${printable(check.combat.weaponModifier)} · BE ${printable(check.combat.mobilityPenalty)}` : '';

function collect(character) {
  const result = new Map();
  for (const check of character?.checks ?? []) {
    let key;
    try { key = referenceKey(checkReference(check)); } catch { continue; }
    if (!result.has(key)) result.set(key, []);
    result.get(key).push(check);
  }
  return result;
}

export function compareCharacters(previous, next) {
  const before = collect(previous), after = collect(next), rows = [];
  const add = (label, oldValue, newValue, type = 'changed') => rows.push({ label, before: printable(oldValue), after: printable(newValue), type });
  if (previous?.profile?.name !== next?.profile?.name) add('Charaktername', previous?.profile?.name, next?.profile?.name);
  if (previous?.sourceVersion !== next?.sourceVersion) add('Dateiversion', previous?.sourceVersion, next?.sourceVersion);
  const oldFocus = characterFocus(previous), newFocus = characterFocus(next);
  if (oldFocus !== newFocus) add('Kampffokus (OFF / DEF)', oldFocus === null ? null : `${oldFocus} / ${-oldFocus}`, newFocus === null ? null : `${newFocus} / ${-newFocus}`);
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    const oldChecks = before.get(key) ?? [], newChecks = after.get(key) ?? [];
    const label = newChecks[0]?.name ?? oldChecks[0]?.name ?? 'Probe';
    if (oldChecks.length > 1 || newChecks.length > 1) {
      add(label, `${oldChecks.length} Einträge`, `${newChecks.length} Einträge`, 'ambiguous');
      continue;
    }
    if (!oldChecks.length) { add(label, null, newChecks[0].value, 'added'); continue; }
    if (!newChecks.length) { add(label, oldChecks[0].value, null, 'removed'); continue; }
    const oldCheck = oldChecks[0], newCheck = newChecks[0];
    if (oldCheck.value !== newCheck.value) add(label, oldCheck.value, newCheck.value);
    if (attributes(oldCheck) !== attributes(newCheck)) add(`${label} · Probenattribute`, attributes(oldCheck) || null, attributes(newCheck) || null);
    if (calculation(oldCheck) !== calculation(newCheck)) add(`${label} · Berechnung`, calculation(oldCheck) || null, calculation(newCheck) || null);
    if ((oldCheck.reason ?? '') !== (newCheck.reason ?? '')) add(`${label} · Verfügbarkeit`, oldCheck.reason || 'Vollständig', newCheck.reason || 'Vollständig');
  }
  const oldArmor=armorItems(previous),newArmor=armorItems(next);
  const state=item=>item?`RS ${item.armor??'–'} · BE ${item.basePenalty??item.penalty??'–'} · Dabei ${item.carried?'ja':'nein'} · Angelegt ${item.equipped?'ja':'nein'}`:null;
  for(const name of new Set([...oldArmor,...newArmor].map(item=>item.name))){
    const before=oldArmor.filter(item=>item.name===name),after=newArmor.filter(item=>item.name===name);
    if(before.length>1||after.length>1){add(`${name} · Rüstung`,`${before.length} Einträge`,`${after.length} Einträge`,'ambiguous');continue;}
    if(state(before[0])!==state(after[0]))add(`${name} · Rüstung`,state(before[0]),state(after[0]));
  }
  return rows;
}
