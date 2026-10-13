export const MODULE_ID = 'pedipalpus-foundry';
export const FLAG = 'character';
export const SCHEMA_VERSION = 1;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
const KNOWN_SAVE_VERSION = 17;
const ATTRIBUTE_KEYS = ['FirstAttribute', 'SecondAttribute', 'ThirdAttribute'];
const COMPLEX_GROUPS = {
  BodySkills: 'Körper', SocialSkills: 'Gesellschaft', NatureSkills: 'Natur',
  AcademicSkills: 'Wissen', CraftingSkills: 'Handwerk'
};
const SIMPLE_GROUPS = { HobbySkills: 'Hobbys', Spells: 'Zauber', Rituals: 'Rituale', Miracles: 'Wunder' };
const EQUIPMENT_GROUPS = {
  MeleeWeapons: 'Nahkampfwaffen', RangedWeapons: 'Fernkampfwaffen', ParryWeapons: 'Parierwaffen',
  Ammunitions: 'Munition', Armors: 'Rüstungen', GeneralItems: 'Gegenstände', Animals: 'Tiere'
};
export const text = value => typeof value === 'string' ? value : '';
const list = value => Array.isArray(value) ? value.filter(x => x && typeof x === 'object' && !Array.isArray(x)) : [];
const integer = value => Number.isSafeInteger(value) ? value : null;
const number = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
const named = value => typeof value === 'string' ? value : text(value?.Name);

function attribute(value) {
  if (!value || typeof value !== 'object') return null;
  const total = integer(value.TotalValue);
  const name = text(value.LongName).trim();
  if (!name || total === null) return null;
  return { name, short: text(value.ShortName), value: total, base: number(value.BaseValue), modifier: number(value.ModValue) };
}

export function parseCharacter(json, importedAt = new Date().toISOString()) {
  if (typeof json !== 'string') throw new Error('Die Charakterdatei konnte nicht gelesen werden.');
  if (new TextEncoder().encode(json).length > MAX_FILE_SIZE) throw new Error('Die Datei ist größer als 5 MB.');
  let raw;
  try { raw = JSON.parse(json.replace(/^\uFEFF/, '')); }
  catch { throw new Error('Die Datei enthält kein gültiges JSON. Bitte eine gespeicherte Pedipalpus-Charakterdatei auswählen.'); }
  return normalizeCharacter(raw, importedAt);
}

export function normalizeCharacter(raw, importedAt = new Date().toISOString()) {
  if (!raw || Array.isArray(raw) || typeof raw !== 'object' || !text(raw.Name).trim()
      || !Array.isArray(raw.PrimaryAttributes) || !raw.PrimaryAttributes.length || integer(raw.Version) === null) {
    throw new Error('Das ist keine vollständige Pedipalpus-Charakterdatei. Name, Version und Attribute werden benötigt.');
  }
  const warnings = [];
  if (raw.Version !== KNOWN_SAVE_VERSION) warnings.push(`Dateiversion ${raw.Version}: geprüft ist Version ${KNOWN_SAVE_VERSION}. Bitte die angezeigten Werte vergleichen.`);
  const attributes = list(raw.PrimaryAttributes).map(attribute).filter(Boolean);
  if (!attributes.length) throw new Error('Die Datei enthält keine lesbaren Attributswerte.');
  const checks = [];
  function addCheck(id, name, group, value, trio, kind = 'skill', reason = '', extra = {}) {
    name = text(name).trim();
    if (!name) return;
    if (/[|\r\n]/.test(name) || name.length > 160) reason ||= 'Der Name ist für einen Würfelbefehl ungeeignet.';
    if (integer(value) === null) reason ||= 'Der Probenwert fehlt.';
    if (kind === 'skill' && (trio.length !== 3 || trio.some(x => !x || /[|\r\n]/.test(x.name)))) reason ||= 'Die drei Probenattribute sind noch nicht vollständig definiert.';
    checks.push({ id, name, group, kind, value, attributes: trio.filter(Boolean), reason, ...extra });
  }
  attributes.forEach((att, i) => addCheck(`primary:${i}`, att.name, 'Attribute', att.value, [], 'attribute'));
  const secondaryTrios = { gMR: ['MU', 'KL', 'IN'], kMR: ['GE', 'KO', 'KK'], RE: ['MU', 'IN', 'GE'] };
  list(raw.SecondaryAttributes).forEach((att, i) => {
    const shorts = secondaryTrios[att.ShortName];
    if (shorts) addCheck(`secondary:${i}`, att.LongName, 'Widerstände & Reaktion', att.TotalValue,
      shorts.map(short => attributes.find(x => x.short === short)));
  });
  for (const [key, group] of Object.entries(COMPLEX_GROUPS)) {
    list(raw[key]).forEach((parent, i) => {
      const trio = ATTRIBUTE_KEYS.map(key => attribute(parent[key]));
      list(parent.Subskills).forEach((sub, j) => addCheck(`${key}:${i}:${j}`, sub.Name, `${group} · ${text(parent.Name)}`, sub.TotalValue, trio, 'skill', '',
        { category: key, foundation: text(parent.Name), foundationValue: number(parent.Value), specializationValue: number(sub.BaseValue) }));
    });
  }
  for (const [key, group] of Object.entries(SIMPLE_GROUPS)) {
    list(raw[key]).forEach((entry, i) => addCheck(`${key}:${i}`, entry.Name, group,
      key === 'HobbySkills' ? entry.Value : entry.TotalValue,
      ATTRIBUTE_KEYS.map(key => attribute(entry[key])), 'skill',
      key === 'Rituals' && entry.HasCheck === false ? 'Für dieses Ritual ist keine Probe erforderlich.' : ''));
  }
  const equipment = [];
  for (const [key, group] of Object.entries(EQUIPMENT_GROUPS)) list(raw[key]).forEach((entry, i) => equipment.push({
    id: `${key}:${i}`, name: text(entry.Name), group, quantity: number(entry.Quantity) ?? 1,
    weight: number(entry.Weight), carried: entry.OnPerson === true,
    description: [text(entry.Description), text(entry.SpecialProperties)].filter(Boolean).join('\n\n'),
    damage: text(entry.Damage), armor: number(entry.Protection), technique: text(entry.UsedSkillsDisplay),
    attack: number(entry.AttackBonus), defense: number(entry.ParryBonus) ?? number(entry.DefenseBonus),
    ticks: number(entry.WeaponSpeed), material: text(entry.Material), penalty: number(entry.MobilityPenalty),
    species: text(entry.Species), currentLE: number(entry.CurrentLe), maxLE: number(entry.MaxLe), capacity: number(entry.CarryCapacity)
  }));
  const detailGroups = {
    Advantages: 'Vorteile', Disadvantages: 'Nachteile', Languages: 'Sprachen', Scripts: 'Schriften',
    MundaneSpecialSkills: 'Allgemeine Sonderfertigkeiten', CombatSpecialSkills: 'Kampfsonderfertigkeiten',
    MagicalSpecialSkills: 'Magische Sonderfertigkeiten', DivineSpecialSkills: 'Göttliche Sonderfertigkeiten',
    Rites: 'Riten', MagicTricks: 'Zaubertricks'
  };
  const details = Object.entries(detailGroups).map(([key, name]) => ({ name, entries: list(raw[key]).map(entry => ({
    name: text(entry.Name), level: number(entry.Level), description: text(entry.Description), cost: number(entry.Cost) ?? number(entry.GpCost)
  })) })).filter(group => group.entries.length);
  return {
    schemaVersion: SCHEMA_VERSION, sourceVersion: raw.Version, importedAt,
    profile: { name: raw.Name.trim(), race: named(raw.Race), culture: named(raw.HomeCultureFamily), subCulture: text(raw.HomeSubCulture), socialClass: text(raw.SocialClass),
      church: text(raw.ChurchName), apTotal: number(raw.ApTotal), apAvailable: number(raw.ApAvailable),
      weight: number(raw.CarriedWeight), capacity: number(raw.TotalCarryCapacity), notes: text(raw.Notes),
      willpower: number(raw.WillpowerAvailable), willpowerTotal: number(raw.WillpowerTotal), attributeAP: number(raw.AttributeAPAvailable), attributeAPTotal: number(raw.AttributeAPGrantedFromProgression),
      freeAP: number(raw.FreeAPTotal), freeAPSpent: number(raw.FreeAPSpend), gpRace: number(raw.GpForRace), gpAdvantages: number(raw.GpForAdvantages), gpDisadvantages: number(raw.GpForDisadvantages) },
    attributes, checks, equipment, details, warnings,
    secondary: list(raw.SecondaryAttributes).map(attribute).filter(Boolean),
    journal: list(raw.Notes).map(entry => ({ title: text(entry.Title), description: text(entry.Description), date: text(entry.Date) })),
    conditions: { simple: list(raw.SimpleConditions).map(entry => ({ name: text(entry.Name), active: entry.IsActive === true })),
      complex: list(raw.ComplexConditions).map(entry => ({ name: text(entry.Name), level: number(entry.Level) })) },
    combat: { melee: list(raw.MeleeSkills).map(entry => ({ name: text(entry.Name), value: number(entry.Value) })),
      ranged: list(raw.RangedSkills).map(entry => ({ name: text(entry.Name), value: number(entry.Value) })),
      stats: ['Off', 'Def', 'Fk', 'Aw', 'Ws', 'Gs', 'Re', 'Be'].map(key => ({ name: key.toUpperCase(), value: number(raw[key]) ?? text(raw[key]) })) },
    money: list(raw.MoneySources).map(entry => ({ location: text(entry.Location), gold: number(entry.Worth?.Gold), silver: number(entry.Worth?.Silver), copper: number(entry.Worth?.Copper), iron: number(entry.Worth?.Iron) })),
    resources: ['LE', 'AE', 'KE'].map(short => {
      const stat = list(raw.DerivedValues).find(x => x.ShortName === short);
      return { name: short, value: number(raw[`Current${short}`]), max: number(stat?.TotalValue) };
    }).filter(stat => stat.max !== null && (stat.max > 0 || stat.name === 'LE')),
    derived: list(raw.DerivedValues).map(entry => ({ name: text(entry.LongName), short: text(entry.ShortName), base: number(entry.BaseValue), modifier: number(entry.ModValue), value: number(entry.TotalValue) })).filter(x => x.value !== null)
  };
}

export function validSnapshot(value) {
  return value?.schemaVersion === SCHEMA_VERSION && typeof value.profile?.name === 'string'
    && ['checks', 'attributes', 'equipment', 'resources', 'derived', 'details', 'warnings'].every(key => Array.isArray(value[key]));
}
