import {MODULE_ID} from './data.js';
import {getCharacter,savePlayState} from './storage.js';
import {conditionRows,stateResources,memberStateKey} from './play-state.js';
import {readCompanions} from './retinue.js';
import {checkReference,referenceKey,resolveCheck} from './workbench.js';
import {companionKey} from './companions.js';
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const figurePreferences=(prefs,id)=>prefs.figures?.[id]??{theme:'',rememberTheme:false,notes:{},weaponSets:[],activeSet:''};
export const figureTheme=(prefs,id,fallback)=>{const figure=figurePreferences(prefs,id);return figure.rememberTheme&&figure.theme?figure.theme:fallback;};
export const weaponIdentity=check=>JSON.stringify([check.id.split(':')[1],check.combat?.weaponName]);
export function weaponChoices(character){
 const groups=new Map();
 for(const check of character.checks??[]){if(check.kind!=='combat'||check.companionGroup||check.fixedCombat)continue;const instance=check.id.replace(/:(attack|parry|ranged)$/,'');if(!groups.has(instance))groups.set(instance,{key:weaponIdentity(check),name:check.combat.weaponName});}
 const values=[...groups.values()];return values.filter(row=>values.filter(other=>other.key===row.key).length===1);
}
const setFigure=async(app,figure)=>app.persist({...app.preferences,figures:{...(app.preferences.figures??{}),[app.actorId]:figure}});
export async function playStateDialog(app,{memberKey=null}={}){
 const actor=app.actor,link=actor?.getFlag(MODULE_ID,'companion'),source=link?.sourceActorId&&link.active!==false?game.actors.get(link.sourceActorId):actor;
 if(!source?.isOwner||!source.canUserModify(game.user,'update'))throw new Error('Zum Ändern wird Besitzerrecht am Hauptcharakter benötigt.');
 const character=getCharacter(source),expected=JSON.stringify(character),conditions=source===actor&&!memberKey?conditionRows(character):null;
 const members=readCompanions(character),member=link?.sourceActorId?members.find((_row,index)=>{try{return companionKey(character,index)===link.key;}catch{return false;}}):null;
 const targetKey=memberKey??(source!==actor&&member?memberStateKey(member):null);
 const resources=stateResources(character).filter(row=>targetKey?row.key===targetKey:source===actor);
 if(memberKey&&!resources.length)throw new Error('Die Begleiterenergien sind nicht eindeutig zugeordnet. Bitte die Liste aktualisieren.');
 if(!conditions&&!resources.length)throw new Error('Für diese Figur sind keine bearbeitbaren Spielwerte vorhanden.');
 const draft=structuredClone(character.localState??{version:1});
 const t=value=>app.t?.(value)??value;
 const content=`<p>${e(targetKey?resources[0].name:source.name)} · ${e(t('Änderungen gelten in Foundry. Die Quelldatei bleibt unverändert.'))}</p>${conditions?`<h3>${e(t('Zustände'))}</h3>${conditions.simple.map((row,i)=>`<div class="pp-state-row"><label><input type="checkbox" data-simple="${i}" ${row.IsActive?'checked':''}> ${e(row.Name)}</label><label><input type="checkbox" data-simple-suppression="${i}" ${row.IsSuppressed?'checked':''}> ${e(t('Unterdrückt'))}</label></div>`).join('')}${conditions.complex.map((row,i)=>`<div class="pp-state-row"><label>${e(row.Name)} <input data-complex="${i}" type="number" min="0" max="4" step="1" value="${row.Level}"></label><label>${e(t('Unterdrückung'))} <select data-suppression="${i}">${[[0,'Keine'],[1,'Ganz'],[2,'Eine Stufe'],[3,'Zwei Stufen']].map(([value,label])=>`<option value="${value}" ${row.Suppression===value?'selected':''}>${e(t(label))}</option>`).join('')}</select></label></div>`).join('')}`:''}${resources.map((entry,i)=>`<fieldset><legend>${e(entry.name)}</legend>${entry.resources.map(row=>`<label>${e(row.name)} / ${e(row.max)} <span class="pp-energy-editor"><button type="button" data-energy-step="-1" data-energy-row="${i}" data-energy-name="${row.name}" aria-label="${e(entry.name)} ${row.name} um eins verringern">−</button><input data-resource-row="${i}" data-energy="${row.name}" aria-label="${e(entry.name)} ${row.name}" type="number" min="-100000" max="100000" step="1" value="${e(row.value)}"><button type="button" data-energy-step="1" data-energy-row="${i}" data-energy-name="${row.name}" aria-label="${e(entry.name)} ${row.name} um eins erhöhen">+</button></span></label>`).join('')}</fieldset>`).join('')}<p>${e(t('Nur geänderte Werte werden gespeichert. Plus und Minus werden erst mit Speichern übernommen.'))}</p>`;
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:t('Spielstand · Zustände und Energien')},classes:app.dialogClasses,position:{width:520},modal:true,rejectClose:false,content,
  buttons:[{action:'save',label:t('Speichern'),callback:(_ev,_button,dialog)=>{
   let changed=false;
   if(conditions){const selected=structuredClone(conditions);selected.simple.forEach((row,i)=>{row.IsActive=dialog.element.querySelector(`[data-simple="${i}"]`).checked;row.IsSuppressed=dialog.element.querySelector(`[data-simple-suppression="${i}"]`).checked;});selected.complex.forEach((row,i)=>{row.Level=Number(dialog.element.querySelector(`[data-complex="${i}"]`).value);row.Suppression=Number(dialog.element.querySelector(`[data-suppression="${i}"]`).value);});if(JSON.stringify(selected)!==JSON.stringify(conditions)){draft.conditions=selected;changed=true;}}
   dialog.element.querySelectorAll('[data-resource-row]').forEach(field=>{const entry=resources[Number(field.dataset.resourceRow)],name=field.dataset.energy,value=field.value===''?NaN:Number(field.value);if(value===entry.resources.find(row=>row.name===name).value)return;draft.resources??={};draft.resources[entry.key]??={};draft.resources[entry.key][name]=value;changed=true;});return changed?draft:false;
  }},{action:'reset',label:t('Quelldaten verwenden'),callback:()=>{
    if(!targetKey)return {version:1};
    const reset=structuredClone(draft);if(reset.resources)delete reset.resources[targetKey];return reset;
  }},{action:'cancel',label:t('Abbrechen'),callback:()=>false}],render:(_event,dialog)=>{
   dialog.element.querySelectorAll('[data-energy-step]').forEach(button=>button.addEventListener('click',()=>{const field=dialog.element.querySelector(`[data-resource-row="${button.dataset.energyRow}"][data-energy="${button.dataset.energyName}"]`),value=Number(field.value);if(field.value!==''&&Number.isSafeInteger(value))field.value=String(Math.max(-100000,Math.min(100000,value+Number(button.dataset.energyStep))));}));
  }});
 if(!answer||typeof answer!=='object')return;
 await savePlayState(source,answer,expected);await app.render({force:true});
}
export async function infoDialog(app,checkId){
 const character=getCharacter(app.actor),check=character?.checks.find(row=>row.id===checkId);if(!check)throw new Error('Die Fähigkeit ist nicht mehr vorhanden.');
 resolveCheck(character,checkReference(check));
 const actorId=app.actorId,key=referenceKey(checkReference(check)),figure=figurePreferences(app.preferences,actorId);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:check.name},classes:app.dialogClasses,position:{width:480},modal:true,rejectClose:false,
 content:`${check.damage?`<p><strong>Schaden:</strong> ${e(check.damage)}</p>`:''}${(check.info??[]).map(row=>`<p><strong>${e(row.label)}</strong><br>${e(row.text)}</p>`).join('')}${check.reason?`<p>${e(check.reason)}</p>`:''}<label>Meine Spielnotiz<textarea name="abilityNote" rows="4" maxlength="2000">${e(figure.notes?.[key])}</textarea></label><p>Nur für dich gespeichert. Originaldaten und andere Spieler bleiben unverändert.</p>`,
 buttons:[{action:'save',label:'Notiz speichern',callback:(_ev,_button,dialog)=>({note:dialog.element.querySelector('[name="abilityNote"]').value})},{action:'cancel',label:'Schließen',callback:()=>false}]});
 if(!answer||typeof answer!=='object')return;
 if(app.actorId!==actorId)throw new Error('Die Figur wurde inzwischen gewechselt.');
 const latest=figurePreferences(app.preferences,actorId);await setFigure(app,{...latest,notes:{...(latest.notes??{}),[key]:answer.note}});
 await app.render({force:true});
}
export async function weaponSetDialog(app){
 const actor=app.actor,character=getCharacter(actor),figure=figurePreferences(app.preferences,actor.id),weapons=weaponChoices(character);
 if(!weapons.length)throw new Error('Keine eindeutig zugeordneten eigenen Waffen vorhanden.');
 let raw;try{raw=JSON.parse(character.sourceJSON);}catch{}
 const offhands=!raw?.Format?(raw?.ParryWeapons??[]).filter(row=>row.InventoryItemId&&row.OnPerson!==false&&!row.CarrierAnimalId&&(row.Quantity??1)>0&&row.Handedness==='Einhändig'):[];
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:'Waffensets'},classes:app.dialogClasses,position:{width:500},modal:true,rejectClose:false,
 content:`<p>Eigene Auswahl für das Kampfbrett. Alle Begleiter bleiben sichtbar. Entfernte oder mehrdeutige Waffen werden nicht geraten.</p>${figure.weaponSets.map((set,i)=>`<label><input type="checkbox" data-remove-set="${i}"> ${e(set.name)} entfernen</label>`).join('')}<label>Neues Set <input name="setName" maxlength="60" placeholder="Zum Beispiel Schwert und Schild"></label>${weapons.map((weapon,i)=>`<label><input data-set-weapon="${i}" type="checkbox"> ${e(weapon.name)}</label>`).join('')}${offhands.length&&actor.isOwner?`<label>Aktive Nebenhand<select name="setOffHand"><option value="unchanged">Unverändert</option><option value="">Keine</option>${offhands.map(row=>`<option value="${e(row.InventoryItemId)}">${e(row.Name)}</option>`).join('')}</select></label>`:''}`,
 buttons:[{action:'save',label:'Speichern',callback:(_ev,_button,dialog)=>({remove:Array.from(dialog.element.querySelectorAll('[data-remove-set]:checked')).map(field=>Number(field.dataset.removeSet)),name:dialog.element.querySelector('[name="setName"]').value.trim(),weapons:Array.from(dialog.element.querySelectorAll('[data-set-weapon]:checked')).map(field=>weapons[Number(field.dataset.setWeapon)].key),offHand:dialog.element.querySelector('[name="setOffHand"]')?.value??'unchanged'})},{action:'cancel',label:'Abbrechen',callback:()=>false}]});
 if(!answer||typeof answer!=='object')return;
 const sets=figure.weaponSets.filter((_set,i)=>!answer.remove.includes(i));
 if(answer.name){if(!answer.weapons.length)throw new Error('Bitte mindestens eine Waffe für das neue Set wählen.');if(sets.length>=12)throw new Error('Höchstens zwölf Waffensets pro Figur.');sets.push({id:foundry.utils.randomID(),name:answer.name,weapons:answer.weapons,...(answer.offHand!=='unchanged'?{offHand:answer.offHand}:{})});}
 await setFigure(app,{...figure,weaponSets:sets,activeSet:sets.some(set=>set.id===figure.activeSet)?figure.activeSet:''});await app.render({force:true});
}
export async function activateWeaponSet(app,id){
 const figure=figurePreferences(app.preferences,app.actorId),set=figure.weaponSets.find(row=>row.id===id);
 if(id&&!set)throw new Error('Dieses Waffenset ist nicht mehr vorhanden.');
 const character=getCharacter(app.actor),keys=new Set(weaponChoices(character).map(row=>row.key));
 if(set&&set.weapons.some(key=>!keys.has(key)))throw new Error('Eine Waffe fehlt oder ist mehrdeutig. Bitte das Set neu anlegen.');
 if(set?.offHand!==undefined){if(!app.actor.isOwner)throw new Error('Zum Wechseln der Nebenhand werden Besitzerrechte benötigt.');await savePlayState(app.actor,{...(character.localState??{version:1}),offHand:set.offHand},JSON.stringify(character));}
 await setFigure(app,{...figure,activeSet:id});
}
