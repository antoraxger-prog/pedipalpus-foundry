import { validSnapshot } from './data.js';

const NUMBER_LIMIT = 999999999;
const profileText = new Set(['name', 'race', 'culture', 'subCulture', 'socialClass', 'church', 'notes']);
const profileNumbers = new Set(['apTotal', 'apAvailable', 'willpower', 'willpowerTotal', 'attributeAP', 'attributeAPTotal', 'weight', 'capacity']);
const equipmentText = new Set(['name', 'description', 'damage', 'technique', 'material', 'species']);
const equipmentNumbers = new Set(['quantity', 'weight', 'armor', 'attack', 'defense', 'ticks', 'penalty', 'currentLE', 'maxLE', 'capacity']);
const indexed = (array, index) => /^\d+$/.test(index) && array?.[Number(index)];
const revision = character => `${character.importedAt}|${character.updatedAt || ''}|${character.editRevision || 0}`;
export const characterRevision = revision;
export const characterField = (character, path) => {
  const info = descriptor(character, path);
  const value = info.target[info.key];
  if (value == null && ['attributes', 'secondary', 'derived'].includes(path.split('.')[0])) {
    if (info.key === 'base') return info.target.value - (info.target.modifier ?? 0);
    if (info.key === 'modifier') return 0;
  }
  return value;
};

function descriptor(character, path) {
  if (typeof path !== 'string' || path.length > 180) throw new Error('Dieses Feld kann nicht bearbeitet werden.');
  const parts = path.split('.'), [group, index, field] = parts;
  let target, type, key, minimum = -NUMBER_LIMIT;
  if (group === 'profile' && parts.length === 2) {
    target = character.profile; key = index;
    type = profileText.has(key) ? 'text' : profileNumbers.has(key) ? (['weight', 'capacity'].includes(key) ? 'number' : 'integer') : null;
  } else if (['attributes', 'secondary', 'derived'].includes(group) && parts.length === 3 && ['base', 'modifier', 'value'].includes(field)) {
    target = indexed(character[group], index); key = field; type = 'integer';
  } else if (group === 'checks' && parts.length === 3 && ['value', 'foundationValue', 'specializationValue'].includes(field)) {
    target = character.checks.find(check => check.id === index); key = field; type = 'integer';
    if (field !== 'value' && (!target?.id.match(/^(Body|Social|Nature|Academic|Crafting)Skills:\d+:\d+$/))) target = null;
  } else if (group === 'resources' && parts.length === 3 && ['value', 'max'].includes(field)) {
    target = indexed(character.resources, index); key = field; type = 'integer';
    if (field === 'max') minimum = 0;
  } else if (group === 'equipment' && parts.length === 3) {
    target = indexed(character.equipment, index); key = field;
    type = equipmentText.has(field) ? 'text' : equipmentNumbers.has(field) ? 'number' : field === 'carried' ? 'boolean' : null;
    if (['quantity', 'weight', 'maxLE', 'capacity'].includes(field)) minimum = 0;
  } else if (group === 'money' && parts.length === 3 && ['location', 'gold', 'silver', 'copper', 'iron'].includes(field)) {
    target = indexed(character.money, index); key = field; type = field === 'location' ? 'text' : 'integer'; minimum = 0;
  } else if (group === 'journal' && parts.length === 3 && ['title', 'description', 'date'].includes(field)) {
    target = indexed(character.journal, index); key = field; type = 'text';
  } else if (group === 'conditions' && parts.length === 4 && ((index === 'simple' && parts[3] === 'active') || (index === 'complex' && parts[3] === 'level'))) {
    target = indexed(character.conditions?.[index], field); key = parts[3]; type = index === 'simple' ? 'boolean' : 'integer'; minimum = 0;
  } else if (group === 'details' && parts.length === 5 && field === 'entries' && ['name', 'description', 'level', 'cost'].includes(parts[4])) {
    target = indexed(indexed(character.details, index)?.entries, parts[3]); key = parts[4];
    type = ['name', 'description'].includes(key) ? 'text' : 'number'; minimum = 0;
  } else if (group === 'combat' && parts.length === 4 && ['melee', 'ranged', 'stats'].includes(index) && parts[3] === 'value') {
    target = indexed(character.combat?.[index], field); key = 'value'; type = 'integer';
  }
  if (!target || !type) throw new Error('Dieses Feld kann nicht bearbeitet werden.');
  return { target, key, type, minimum };
}

function validate(value, { type, minimum }, path) {
  if (type === 'text') {
    if (typeof value !== 'string' || value.length > 20000) throw new Error('Der Text ist zu lang oder ungültig.');
    if (path === 'profile.name' && !value.trim()) throw new Error('Der Charakter benötigt einen Namen.');
    return value;
  }
  if (type === 'boolean') {
    if (typeof value !== 'boolean') throw new Error('Ungültiger Schalterwert.');
    return value;
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > NUMBER_LIMIT || value < minimum
    || (type === 'integer' && !Number.isSafeInteger(value))) throw new Error('Bitte einen gültigen Zahlenwert eingeben.');
  return value;
}

function updateAttributeChecks(character, attribute) {
  for (const check of character.checks) {
    for (const ref of check.attributes) {
      if ((attribute.short && ref.short === attribute.short) || ref.name === attribute.name) Object.assign(ref, attribute);
    }
  }
}

function applyChange(character, change) {
  const { path } = change, parts = path.split('.'), [group, index, field] = parts;
  const info = descriptor(character, path), previous = info.target[info.key];
  const baseBefore = info.target.base ?? (info.target.value ?? 0) - (info.target.modifier ?? 0);
  const value = validate(change.value, info, path);
  info.target[info.key] = value;
  if (['attributes', 'secondary', 'derived'].includes(group)) {
    const stat = info.target;
    if (field !== 'value') {
      if (stat.base === null || stat.base === undefined) stat.base = baseBefore;
      stat.value = stat.base + (stat.modifier ?? 0);
    }
    else if (typeof stat.base === 'number') stat.modifier = value - stat.base;
    if (group === 'attributes') {
      const check = character.checks.find(check => check.id === `primary:${index}`);
      if (check) check.value = stat.value;
      updateAttributeChecks(character, stat);
    } else if (group === 'secondary') {
      const check = character.checks.find(check => check.id === `secondary:${index}`);
      if (check) check.value = stat.value;
    } else {
      const resource = character.resources.find(resource => resource.name === stat.short);
      if (resource) resource.max = stat.value;
    }
  } else if (group === 'checks') {
    const check = info.target;
    if (field === 'foundationValue') {
      const prefix = check.id.split(':').slice(0, 2).join(':') + ':';
      for (const sibling of character.checks.filter(entry => entry.id.startsWith(prefix))) {
        sibling.foundationValue = value;
        sibling.value = (sibling.value ?? 0) + value - (previous ?? 0);
      }
    } else if (field === 'specializationValue') check.value = (check.value ?? 0) + value - (previous ?? 0);
    else if (check.id.startsWith('primary:')) {
      const stat = character.attributes[Number(check.id.split(':')[1])];
      stat.value = value;
      if (typeof stat.base === 'number') stat.modifier = value - stat.base;
      updateAttributeChecks(character, stat);
    }
  } else if (group === 'resources' && field === 'max') {
    const stat = character.derived.find(stat => stat.short === info.target.name);
    if (stat) { stat.value = value; if (typeof stat.base === 'number') stat.modifier = value - stat.base; }
  }
}

export function applyCharacterChanges(snapshot, changes, updatedAt = new Date().toISOString()) {
  if (!validSnapshot(snapshot) || !Array.isArray(changes) || changes.length > 1000) throw new Error('Die Charakteränderungen sind ungültig.');
  const character = JSON.parse(JSON.stringify(snapshot));
  for (const change of changes) applyChange(character, change);
  for (const check of character.checks) {
    if (check.kind === 'skill' && check.attributes.length === 3) {
      if (check.attributes.some(att => !Number.isSafeInteger(att.value)) || !Number.isSafeInteger(check.value)) throw new Error('Eine Probe enthält ungültige Werte.');
    }
  }
  character.updatedAt = updatedAt;
  character.editRevision = (snapshot.editRevision || 0) + 1;
  return character;
}
