const att = (LongName, ShortName, TotalValue) => ({ LongName, ShortName, TotalValue });
export function fixture() {
  const kl = att('Klugheit', 'KL', 16), intuition = att('Intuition', 'IN', 14);
  return {
    Version: 17, Name: 'Testcharakter', Race: { Name: 'Mittelländer' }, ApTotal: 100, ApAvailable: 25,
    PrimaryAttributes: [att('Mut', 'MU', 15), kl, intuition, att('Gewandtheit', 'GE', 10), att('Konstitution', 'KO', 13), att('Körperkraft', 'KK', 7)],
    SecondaryAttributes: [{ LongName: 'Geistige Magieresistenz', ShortName: 'gMR', TotalValue: 1 }],
    AcademicSkills: [{ Name: 'Derekunde', Value: 4, FirstAttribute: kl, SecondAttribute: kl, ThirdAttribute: intuition,
      DefaultFirstAttribute: { ...kl, TotalValue: 99 }, Subskills: [{ Name: 'Geographie', BaseValue: 4, TotalValue: 8 }] }],
    HobbySkills: [{ Name: 'Schach', Value: 0, TotalValue: 99, FirstAttribute: kl, SecondAttribute: kl, ThirdAttribute: intuition }],
    Spells: [{ Name: 'Noch undefiniert', TotalValue: 2, FirstAttribute: null, SecondAttribute: null, ThirdAttribute: null }],
    Rituals: [{ Name: 'Ohne Probe', TotalValue: 0, HasCheck: false }],
    MeleeWeapons: [{ Name: 'Rapier', Quantity: 1, Weight: 1.4, OnPerson: true, Damage: '1W6+5', SpecialProperties: 'Leichte Waffe.' }],
    CurrentLE: 31, DerivedValues: [{ LongName: 'Lebensenergie', ShortName: 'LE', TotalValue: 31 }],
    Notes: '<script>bad()</script>', SelectedComplexSkill: { Name: 'Duplicated selected row', Subskills: [{ Name: 'Geographie', TotalValue: 100 }] }
  };
}

export function combatFixture() {
  const raw = fixture();
  Object.assign(raw,{Off:'5',Def:'5',Fk:'6',OffOffset:-4,DefOffset:4,Be:5,PortraitFileName:'Testcharakter.png',
    MeleeSkills:[{Name:'Fechtwaffen',Value:5},{Name:'Schwerter',Value:6}],RangedSkills:[{Name:'Armbrüste',Value:5}],
    MeleeWeapons:[{Name:'Rapier',UsedSkills:['Fechtwaffen','Schwerter'],AttackBonus:0,ParryBonus:1,MobilityTolerance:1}],
    ParryWeapons:[{Name:'Schild',UsedSkill:'Schwerter',AttackBonus:-2,DefenseBonus:3,MobilityTolerance:2}],
    RangedWeapons:[{Name:'Armbrust',UsedSkills:['Armbrueste'],AttackBonus:0}],
    Animals:[{Name:'Wolf',Attacks:[{Name:'Biss',AttackValue:14,ParryValue:7}]}]});
  return raw;
}

