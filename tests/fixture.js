const att = (LongName, ShortName, TotalValue) => ({ LongName, ShortName, TotalValue });
export function npcFixture(){
 const keys=['MU','KL','IN','CH','FF','GE','KO','KK','gMR','kMR','RE'],names=['Mut','Klugheit','Intuition','Charisma','Fingerfertigkeit','Gewandtheit','Konstitution','Körperkraft','Geistige Magieresistenz','Körperliche Magieresistenz','Reaktionsvermögen'];
 const attributes=keys.map((Key,index)=>({Key,Name:names[index],BaseValue:index<8?12:index===8?2:index===9?1:3,RaceModifier:Key==='KO'?1:0,Modifier:0}));
 const npc={Name:'Alrik Testwache',RaceName:'Mittelländer',LifeFactor:1.2,RaceSpeed:0,RaceCarryBonus:0,Focus:2,AstralBody:3,Consecrated:true,ConsecrationLevel:1,AdditionalImpairment:0,Notes:'Nur Testdaten',CurrentLe:25,CurrentAe:10,CurrentKe:4,Attributes:attributes,
  Derived:['LE','AE','KE','OFF','DEF','FKB','AW','WS','TK','GS','BL','WA'].map(Key=>({Key,Calculated:999,Modifier:0})),
  Abilities:[{Name:'Einbrechen',Grade:'Geselle'}],Features:[{Name:'Körper',Grade:'Geselle'},{Name:'Objekt',Grade:'Meister'}],
  Techniques:[{Name:'Äxte und Beile',Type:'Melee',Value:12},{Name:'Schwerter',Type:'Melee',Value:12},{Name:'Bögen',Type:'Ranged',Value:12}],
  Weapons:[{Name:'Testaxt',Kind:'Nahkampf',Techniques:'Äxte und Beile',AttackModifier:0,ParryModifier:0,DefenseBonus:0,MobilityTolerance:3},{Name:'Testbogen',Kind:'Fernkampf',Techniques:'Bögen',AttackModifier:1,MobilityTolerance:4},{Name:'Testschild',Kind:'Parierwaffe',Techniques:'Schwerter',ParryModifiers:'-2;0;2',TrainingLevel:2,DefenseBonus:1,MobilityTolerance:2}],
  Armors:[{Name:'Testpanzer',Protection:4,MobilityPenalty:5,Equipped:true,Weight:10000}],
  Powers:[{Name:'Testzauber',Kind:'Zauber',Features:'Körper; Objekt',Grade:'Vom Merkmal',FirstAttribute:'KL',SecondAttribute:'FF',ThirdAttribute:'KO',HasCheck:true},{Name:'Eigene Stufe',Kind:'Zauber',Features:'Objekt',Grade:'Lehrling',FirstAttribute:'MU',SecondAttribute:'MU',ThirdAttribute:'IN',HasCheck:true},{Name:'Ohne Merkmal',Kind:'Zauber',Features:'Unbekannt',Grade:'Vom Merkmal',HasCheck:true},{Name:'Probenlos',Kind:'Ritual',Grade:'Amateur',HasCheck:false},{Name:'Testliturgie',Kind:'Liturgie',Grade:'Amateur',FirstAttribute:'MU',SecondAttribute:'IN',ThirdAttribute:'CH',HasCheck:true}],
  Conditions:[],Retinue:['Tier','Dämon','Untoter','Chimäre','Person','Elementar','Golem'].map((Kind,index)=>({Name:`Begleiter ${Kind}`,Kind,Category:'Test',Attributes:attributes.slice(0,8).map(row=>({...row,BaseValue:8,RaceModifier:0})),CurrentLe:14,MaxLe:20,CurrentAe:4,MaxAe:8,MentalResistance:2,PhysicalResistance:3,Abilities:[{Name:'Wachen',Grade:'Amateur'}],Attacks:[{Name:'Hieb',AttackValue:6,ParryValue:7,IsRanged:index===5}]}))};
 return {Format:'Pedipalpus.Npc',Version:1,Npc:npc};
}
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


export function retinueFixture(){
 const raw=combatFixture();
 const values={MU:11,KL:12,IN:13,CH:14,FF:15,GE:16,KO:17,KK:18,MentalMagicResistance:4,PhysicalMagicResistance:5,CurrentLe:14,MaxLe:20};
 raw.Animals=[{...values,Name:'Skelett',Species:'Träger',InventoryId:'old-skeleton',Attacks:[{Name:'Hieb',AttackValue:6,ParryValue:6}]}];
 raw.Demons=[{...values,Name:'Testdämon',Domain:'Testdomäne',InventoryId:'demon-1',AstralEnergy:30,CurrentAstralEnergy:22,Attacks:[{Name:'Klaue',AttackValue:18,ParryValue:12},{Name:'Feuer',AttackValue:19,IsRanged:true}],MundaneAbilities:[{Name:'Überreden',Value:12}],MagicalAbilities:[{Name:'Illusion',Value:16,FirstAttribute:'KL',SecondAttribute:'KL',ThirdAttribute:'IN'}]}];
 raw.Undead=[{...values,Name:'Wache',Species:'Skelett',InventoryId:'undead-1',Classification:'Niederer Untoter',Attacks:[{Name:'Bogen',AttackValue:8,IsRanged:true}],MundaneAbilities:[{Name:'Wachen',Value:4,FirstAttribute:'MU',SecondAttribute:'IN',ThirdAttribute:'IN'}],MagicalAbilities:[]}];
 return raw;
}
