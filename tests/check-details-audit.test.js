import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCharacter} from '../scripts/data.js';
import {npcFixture} from './fixture.js';

test('NPC notes follow their own ability or feature even when both have the same name',()=>{
 const raw=npcFixture();raw.Npc.Abilities[0]={Name:'Mut',Grade:'Geselle',Notes:'Fähigkeitsnotiz'};raw.Npc.Features[0]={Name:'Mut',Grade:'Meister',Notes:'Merkmalsnotiz'};
 const character=normalizeCharacter(raw),find=id=>character.checks.find(check=>check.id===id);
 assert.deepEqual(find('NpcAbilities:0').info,[{label:'Hinweise',text:'Fähigkeitsnotiz'}]);
 assert.deepEqual(find('NpcFeatures:0').info,[{label:'Hinweise',text:'Merkmalsnotiz'}]);
 assert.equal(find('primary:0').info,undefined);
});

test('NPC powers retain their own rules and notes by kind and position, including sanitized names',()=>{
 const raw=npcFixture(),power=(Kind,Name,Rules,Notes)=>({Kind,Name,Grade:'Amateur',HasCheck:true,FirstAttribute:'MU',SecondAttribute:'IN',ThirdAttribute:'CH',Rules,Notes});
 raw.Npc.Powers=[power('Ritual','Gemeinsam','Ritualregel','Ritualnotiz'),power('Zauber','Gemeinsam','Zauberregel','Zaubernotiz'),power('Liturgie','Gemeinsam','Liturgieregel','Liturgienotiz'),power('Ritus','Zweiter Ritus','Ritusregel','Ritusnotiz'),power('Zauber','Name|geteilt','Zweite Zauberregel','Zweite Zaubernotiz')];
 const original=JSON.stringify(raw),character=normalizeCharacter(raw),find=id=>character.checks.find(check=>check.id===id);
 for(const [id,prefix] of [['Rituals:0','Ritual'],['Spells:0','Zauber'],['Miracles:0','Liturgie'],['Rituals:1','Ritus']])assert.deepEqual(find(id).info,[{label:'Regeln',text:prefix+'regel'},{label:'Hinweise',text:prefix+'notiz'}]);
 assert.equal(find('Spells:1').name,'Name/geteilt');assert.equal(find('Spells:1').info[0].text,'Zweite Zauberregel');
 assert.equal(JSON.stringify(raw),original);
});

test('NPC source details leave calculated weapon damage intact',()=>{
 const raw=npcFixture();Object.assign(raw.Npc.Weapons[0],{Damage:'1W6+2',TpKk:'10/1',Notes:'Eigene Waffennotiz'});
 const check=normalizeCharacter(raw).checks.find(check=>check.id==='combat:MeleeWeapons:0:attack');
 assert.equal(check.damage,'1W6+4');assert.deepEqual(check.info,[{label:'Hinweise',text:'Eigene Waffennotiz'}]);
});
