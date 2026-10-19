export const NPC_FORMAT='Pedipalpus.Npc';
export const NPC_GRADES=['Amateur','Lehrling','Geselle','Meister','Legende'];
const keys=['MU','KL','IN','CH','FF','GE','KO','KK'];
const names=['Mut','Klugheit','Intuition','Charisma','Fingerfertigkeit','Gewandtheit','Konstitution','Körperkraft'];
const secondary=['gMR','kMR','RE'];
const derivedKeys=['LE','AE','KE','OFF','DEF','FKB','AW','WS','TK','GS','BL','WA'];
const labels={gMR:'Geistige Magieresistenz',kMR:'Körperliche Magieresistenz',RE:'Reaktionsvermögen',LE:'Lebensenergie',AE:'Astralenergie',KE:'Karmaenergie',OFF:'Offensive',DEF:'Defensive',FKB:'Fernkampfbasis',AW:'Ausweichen',WS:'Wundschwelle',TK:'Tragkraft',GS:'Geschwindigkeit',BL:'Bindungslimit',WA:'Wahrnehmung'};
const fail=message=>{throw new Error(`NSC-Datei: ${message}`);};
const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
const array=(value,name)=>{if(!Array.isArray(value)||value.some(item=>!object(item)))fail(`${name} fehlt oder enthält ungültige Einträge.`);return value;};
const numeric=(value,name,fallback=0,integer=true)=>{value=value===undefined?fallback:value;if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>100000||integer&&!Number.isSafeInteger(value))fail(`${name} enthält keinen gültigen Zahlenwert.`);return value;};
const string=(value,name,fallback='')=>{if(value===undefined)return fallback;if(typeof value!=='string')fail(`${name} enthält keinen gültigen Text.`);return value;};
const bool=(value,name,fallback=false)=>{if(value===undefined)return fallback;if(typeof value!=='boolean')fail(`${name} ist ungültig.`);return value;};
const label=value=>value.replaceAll('|','/').replace(/[\r\n]/g,' ').trim();
const ascii=value=>value.replace(/[äöüÄÖÜß]/g,c=>({ä:'ae',ö:'oe',ü:'ue',Ä:'AE',Ö:'OE',Ü:'UE',ß:'ss'}[c])).toLocaleLowerCase('de');
const split=value=>value.split(';').map(part=>part.trim()).filter(Boolean);
const weight=row=>{if(numeric(row.Weight,'Gewicht',0,false)<0)fail('Ein Gewicht ist negativ.');};
export const npcRound=value=>Math.sign(value)*Math.round(Math.abs(value));
const grade=value=>{const index=NPC_GRADES.indexOf(value);if(index<0)fail('Eine Fähigkeitsstufe ist unbekannt.');return (index+1)*4;};

function attributes(values,expected){
 const rows=array(values,'Attribute');
 if(rows.length!==expected.length||new Set(rows.map(row=>row.Key)).size!==expected.length||rows.some(row=>!expected.includes(row.Key)))fail('Die Attributstruktur fehlt oder ist mehrdeutig.');
 return expected.map(key=>{
  const row=rows.find(row=>row.Key===key),parts=['BaseValue','RaceModifier','Modifier'].map(field=>numeric(row[field],field));
  if(parts.some(value=>Math.abs(value)>1000))fail('Ein Attribut liegt außerhalb des unterstützten Bereichs.');
  return {LongName:label(string(row.Name,'Attributname',names[keys.indexOf(key)]??labels[key])),ShortName:key,BaseValue:parts[0],ModValue:parts[1]+parts[2],TotalValue:parts.reduce((a,b)=>a+b,0)};
 });
}
function abilities(values,name){return array(values,name).map(row=>{const name=label(string(row.Name,'Fähigkeitsname'));if(!name)fail('Ein Fähigkeitsname fehlt.');return {Name:name,Value:grade(row.Grade)};});}
function validateGraph(value,depth=0){
 if(depth>64)fail('Die Datenstruktur ist zu tief verschachtelt.');
 if(typeof value==='number'&&(!Number.isFinite(value)||Math.abs(value)>100000))fail('Ein Zahlenwert liegt außerhalb des unterstützten Bereichs.');
 if(value&&typeof value==='object')for(const child of Object.values(value))validateGraph(child,depth+1);
}

export function mapNpcFile(file){
 if(!object(file)||file.Format!==NPC_FORMAT||file.Version!==1||!object(file.Npc)||'PrimaryAttributes' in file||'Name' in file)fail('Format oder Version wird nicht unterstützt. Erwartet wird Pedipalpus.Npc, Version 1.');
 validateGraph(file);
 const npc=file.Npc,name=string(npc.Name,'Name').trim();if(!name)fail('Der Name fehlt.');
 const all=attributes(npc.Attributes,[...keys,...secondary]),primary=all.filter(attr=>keys.includes(attr.ShortName));
 const a=key=>all.find(attr=>attr.ShortName===key).TotalValue;
 const originalDerived=array(npc.Derived,'Abgeleitete Werte');
 if(originalDerived.length!==12||new Set(originalDerived.map(row=>row.Key)).size!==12||originalDerived.some(row=>!derivedKeys.includes(row.Key)))fail('Die abgeleiteten Werte fehlen oder sind mehrdeutig.');
 const totals=new Map(),factor=numeric(npc.LifeFactor,'Volksfaktor',1,false),astral=numeric(npc.AstralBody,'Astralleib'),consecration=numeric(npc.ConsecrationLevel,'Weihestufe',2),focus=numeric(npc.Focus,'Fokus');
 if(factor<=0||factor>10||astral<0||astral>5||![1,2].includes(consecration)||focus< -4||focus>4)fail('Volksfaktor, Astralleib, Weihestufe oder Fokus ist ungültig.');
 const rawDerived={LE:15+a('KO')*factor,AE:(a('MU')+a('IN')+a('KO'))*astral*.2,KE:bool(npc.Consecrated,'Geweiht')?(a('MU')+a('IN')+a('CH'))/2*(consecration===1?.5:1):0,
  OFF:Math.max(0,(a('MU')+a('GE')+a('KK')-5)/5),DEF:Math.max(0,(a('IN')+a('GE')+a('KK')-5)/5),FKB:Math.max(0,(a('IN')+a('FF')+a('KK')-5)/5),
  WS:a('KO')/2+1,TK:a('KO')/2+a('KK')+numeric(npc.RaceCarryBonus,'Tragkraftbonus'),GS:8+numeric(npc.RaceSpeed,'Geschwindigkeitsbonus'),BL:2*a('MU'),WA:(a('KL')+a('IN')+a('FF')+a('KO'))/4-5};
 for(const key of derivedKeys.filter(key=>key!=='AW'))totals.set(key,npcRound(rawDerived[key]+numeric(originalDerived.find(row=>row.Key===key).Modifier,'Abgeleiteter Modifikator',0,false)));
 totals.set('AW',npcRound(totals.get('DEF')+a('RE')+numeric(originalDerived.find(row=>row.Key==='AW').Modifier,'Ausweichen-Modifikator',0,false)));
 const raw={Version:17,Name:name,PrimaryAttributes:primary,SecondaryAttributes:all.filter(attr=>secondary.includes(attr.ShortName)),Race:{Name:string(npc.RaceName,'Volk')},Notes:string(npc.Notes,'Notizen'),
  Off:totals.get('OFF'),Def:totals.get('DEF'),Fk:totals.get('FKB'),OffDefOffset:focus,OffOffset:focus,DefOffset:-focus,
  CurrentLE:numeric(npc.CurrentLe,'LE',27),CurrentAE:numeric(npc.CurrentAe,'AE'),CurrentKE:numeric(npc.CurrentKe,'KE'),
  DerivedValues:derivedKeys.map(key=>({ShortName:key,LongName:labels[key],TotalValue:totals.get(key)})),MeleeWeapons:[],ParryWeapons:[],RangedWeapons:[],MeleeSkills:[],RangedSkills:[],Spells:[],Rituals:[],Miracles:[],Animals:[],Demons:[],Undead:[],Chimeras:[],Persons:[],Elementals:[],Golems:[]};
 raw.Armors=array(npc.Armors,'Rüstungen').map(row=>{weight(row);return {Name:label(string(row.Name,'Rüstungsname')),Protection:numeric(row.Protection,'Rüstungsschutz'),BaseMobilityPenalty:numeric(row.MobilityPenalty,'Rüstungs-BE'),MobilityPenalty:numeric(row.MobilityPenalty,'Rüstungs-BE'),IsEquiped:bool(row.Equipped,'Angelegt',true),OnPerson:true};});
 raw.Be=raw.Armors.filter(row=>row.IsEquiped).reduce((sum,row)=>sum+Math.max(0,row.MobilityPenalty),0)+numeric(npc.AdditionalImpairment,'Zusätzliche BE');
 const techniques=array(npc.Techniques,'Kampftechniken').map(row=>({Name:label(string(row.Name,'Kampftechnik')),SourceName:string(row.Name,'Kampftechnik'),Value:numeric(row.Value,'Talentwert'),Type:string(row.Type,'Technikart','Melee')}));
 if(techniques.some(row=>!['Melee','Ranged'].includes(row.Type)||row.Value<0||row.Value>20))fail('Eine Kampftechnik ist ungültig.');
 const ordered=[...techniques].sort((left,right)=>right.Value-left.Value);
 raw.MeleeSkills=ordered.filter(row=>row.Type==='Melee');raw.RangedSkills=ordered.filter(row=>row.Type==='Ranged');
 for(const row of array(npc.Weapons,'Waffen')){
  weight(row);
  const ranged=string(row.Kind,'Waffenart','Nahkampf')==='Fernkampf',allowed=split(string(row.Techniques,'Waffentechniken'));
  const mods=split(string(row.ParryModifiers,'Paradeboni')).map(part=>/^[+-]?\d+$/.test(part)&&Number(part)>=-2147483648&&Number(part)<=2147483647?Number(part):0);
  const level=numeric(row.TrainingLevel,'Waffenausbildung');
  const defense=numeric(row.DefenseBonus,'Abwehrbonus')+(mods.length?mods[Math.min(mods.length-1,Math.max(0,level))]:numeric(row.ParryModifier,'Paradebonus'));
  raw[ranged?'RangedWeapons':string(row.Kind,'Waffenart')==='Parierwaffe'?'ParryWeapons':'MeleeWeapons'].push({Name:label(string(row.Name,'Waffenname')),
   UsedSkills:ordered.filter(tech=>tech.Type===(ranged?'Ranged':'Melee')&&allowed.some(name=>ascii(name)===ascii(tech.SourceName))).map(tech=>tech.Name),
   AttackBonus:numeric(row.AttackModifier,'Angriffsbonus'),ParryBonus:defense,DefenseBonus:defense,MobilityTolerance:numeric(row.MobilityTolerance,'Waffentoleranz'),Damage:string(row.Damage,'Schaden')});
 }
 const skillRows=[];
 for(const [collection,prefix,title] of [['Abilities','NpcAbilities','Fähigkeiten'],['Features','NpcFeatures','Merkmale']])abilities(npc[collection],title).forEach((entry,index)=>skillRows.push({id:`${prefix}:${index}`,name:entry.Name,category:prefix,group:title,kind:'skill',value:entry.Value,attributes:[],reason:'',needsAttributes:true,npcChoice:{keys:[],remember:true}}));
 skillRows.push({id:'NpcDerived:WA',name:labels.WA,category:'attributes',group:'Wahrnehmung',kind:'skill',value:totals.get('WA'),attributes:['KL','IN','IN'].map(key=>{const att=primary.find(attr=>attr.ShortName===key);return {name:att.LongName,short:key,value:att.TotalValue};}),reason:'',npcChoice:{keys:['KL','IN','IN'],remember:false}});
 const features=npc.Features.map(row=>({Name:row.Name,Value:grade(row.Grade)})),warnings=[],powerCounts={Spells:0,Rituals:0,Miracles:0};
 for(const power of array(npc.Powers,'Zauber und Liturgien')){
  const kind=string(power.Kind,'Kraftart','Zauber'),name=label(string(power.Name,'Kraftname')),own=string(power.Grade,'Kraftstufe','Vom Merkmal');
  if(!['Zauber','Ritual','Ritus','Liturgie'].includes(kind))fail('Eine Kraftart ist unbekannt.');
  const schools=split(string(power.Features,'Merkmale'));
  if(kind==='Liturgie'&&own==='Vom Merkmal')fail('Eine Liturgie benötigt eine eigene Stufe.');
  const value=own==='Vom Merkmal'?Math.max(0,...features.filter(feature=>schools.some(school=>ascii(school)===ascii(feature.Name))).map(feature=>feature.Value)):grade(own);
  const trio=['FirstAttribute','SecondAttribute','ThirdAttribute'].map(field=>string(power[field],'Probenattribut'));
  const available=trio.every(key=>keys.includes(key))&&new Set(trio).size>=2;
  const attributes=available?trio.map(key=>{const att=primary.find(attr=>attr.ShortName===key);return {name:att.LongName,short:key,value:att.TotalValue};}):[];
  const hasCheck=bool(power.HasCheck,'Probe erforderlich',true),reason=!hasCheck?'Für diese Kraft ist keine Probe erforderlich.':value<=0?'Für diese Kraft fehlt ein passendes Merkmal oder eine eigene Stufe.':'';
  const collection=kind==='Liturgie'?'Miracles':kind==='Ritual'||kind==='Ritus'?'Rituals':'Spells';
  const index=powerCounts[collection]++;
  skillRows.push({id:`${collection}:${index}`,name,group:kind,category:collection,kind:'skill',value,attributes,reason,needsAttributes:!available,npcChoice:{keys:available?trio:[],remember:false}});
  if(hasCheck&&reason)warnings.push(`${name}: ${reason}`);
 }
 const groups={'Tier':'Animals','Dämon':'Demons','Untoter':'Undead','Chimäre':'Chimeras','Person':'Persons','Elementar':'Elementals','Golem':'Golems'};
 for(const member of array(npc.Retinue,'Gefolge')){
  const kind=string(member.Kind,'Gefolgsart','Dämon'),collection=groups[kind];if(!collection)fail('Eine Gefolgsart ist unbekannt.');
  const memberName=string(member.Name,'Gefolgsname').trim();if(!memberName)fail('Ein Gefolgsname fehlt.');
  const attrs=attributes(member.Attributes,keys),row={Name:label(memberName),Species:`${kind}${member.Category?` · ${string(member.Category,'Kategorie')}`:''}`,InventoryId:`npc:${JSON.stringify([kind,memberName.normalize('NFC').toLocaleLowerCase('de')])}`,
   CurrentLe:numeric(member.CurrentLe,'Gefolgs-LE'),MaxLe:numeric(member.MaxLe,'Maximale Gefolgs-LE'),CurrentAstralEnergy:numeric(member.CurrentAe,'Gefolgs-AE'),AstralEnergy:numeric(member.MaxAe,'Maximale Gefolgs-AE'),
   MentalMagicResistance:numeric(member.MentalResistance,'Geistige MR'),PhysicalMagicResistance:numeric(member.PhysicalResistance,'Körperliche MR'),
   MundaneAbilities:abilities(member.Abilities,'Gefolgsfähigkeiten'),Attacks:array(member.Attacks,'Gefolgsangriffe').map(attack=>({Name:label(string(attack.Name,'Angriffsname')),AttackValue:numeric(attack.AttackValue,'Angriff'),ParryValue:numeric(attack.ParryValue,'Parade'),IsRanged:bool(attack.IsRanged,'Fernangriff')}))};
  for(const attr of attrs)row[attr.ShortName]=attr.TotalValue;
  raw[collection].push(row);
 }
 array(npc.Conditions,'Zustände');
 return {raw,skillRows,warnings,dodge:totals.get('AW')};
}

export function withNpcAttributes(character,id,selected){
 const check=character.checks.find(check=>check.id===id);
 if(!check?.npcChoice||!Array.isArray(selected)||selected.length!==3||new Set(selected).size<2)throw new Error('Drei gültige Attribute wählen. Alle drei Attribute dürfen nicht gleich sein.');
 const attributes=selected.map(key=>character.attributes.find(attr=>attr.short===key));
 if(attributes.some(attr=>!attr))throw new Error('Bitte drei vorhandene Attribute auswählen.');
 return {...character,checks:character.checks.map(entry=>entry.id===id?{...entry,attributes,needsAttributes:false,npcChoice:{...entry.npcChoice,keys:[...selected]}}:entry)};
}
export function retainNpcChoices(previous,next){
 if(previous?.sourceFormat!==NPC_FORMAT||next.sourceFormat!==NPC_FORMAT||previous.profile.name!==next.profile.name)return next;
 const identity=check=>JSON.stringify([check.category,check.name]);
 for(const check of next.checks){
  if(!check.npcChoice?.remember)continue;
  const matches=previous.checks.filter(old=>old.npcChoice?.remember&&identity(old)===identity(check));
  if(matches.length===1&&next.checks.filter(row=>identity(row)===identity(check)).length===1){try{next=withNpcAttributes(next,check.id,matches[0].npcChoice.keys);}catch{}}
 }
 return next;
}
