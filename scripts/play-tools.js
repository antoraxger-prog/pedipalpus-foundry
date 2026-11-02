import {MODULE_ID} from './data.js';
import {getCharacter,savePlayState} from './storage.js';
import {conditionRows,stateResources,memberStateKey} from './play-state.js';
import {readCompanions} from './retinue.js';
import {checkReference,referenceKey,resolveCheck} from './workbench.js';
import {companionKey,refreshCompanions} from './companions.js';
import {checkDisplayName} from './ork-talents.js';
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const figurePreferences=(prefs,id)=>prefs.figures?.[id]??{theme:'',rememberTheme:false,notes:{},weaponSets:[],activeSet:''};
export const figureTheme=(prefs,id,fallback)=>{const figure=figurePreferences(prefs,id);return figure.rememberTheme&&figure.theme?figure.theme:fallback;};
export const weaponIdentity=check=>JSON.stringify([check.id.split(':')[1],check.combat?.weaponName]);
export function weaponChoices(character,{includeUnavailable=false}={}){
 const groups=new Map();
 for(const check of character?.checks??[]){if(check.kind!=='combat'||check.companionGroup||check.fixedCombat)continue;const instance=check.id.replace(/:(attack|parry|ranged)$/,'');if(!groups.has(instance))groups.set(instance,{key:weaponIdentity(check),name:check.combat.weaponName});}
 const values=[...groups.values()],counts=new Map();for(const row of values)counts.set(row.key,(counts.get(row.key)??0)+1);
 return includeUnavailable?values.map(row=>({...row,unavailable:counts.get(row.key)!==1})):values.filter(row=>counts.get(row.key)===1);
}
const setFigure=async(app,figure)=>app.persist({...app.preferences,figures:{...(app.preferences.figures??{}),[app.actorId]:figure}});
const linkState=link=>JSON.stringify(link?.sourceActorId?[link.sourceActorId,link.key,link.active!==false]:null);
export async function playStateDialog(app,{memberKey=null}={}){
 const actor=app.actor,link=actor?.getFlag(MODULE_ID,'companion'),expectedLink=linkState(link),linked=Boolean(link?.sourceActorId);
 if(linked&&link.active===false)throw new Error('Dieser Begleiter wurde ersetzt. Bitte den aktuellen Begleiter öffnen.');
 const source=linked?game.actors.get(link.sourceActorId):actor;
 if(linked&&!source)throw new Error('Der Hauptcharakter dieses Begleiters ist nicht mehr vorhanden.');
 if(!actor?.isOwner||!actor.canUserModify(game.user,'update'))throw new Error('Zum Ändern werden Besitzerrechte benötigt.');
 if(!source?.isOwner||!source.canUserModify(game.user,'update'))throw new Error('Zum Ändern wird Besitzerrecht am Hauptcharakter benötigt.');
 const character=getCharacter(source);if(!character)throw new Error('Bitte den Hauptcharakter erneut importieren, bevor du den Spielstand änderst.');
 const expected=JSON.stringify(character),conditions=source===actor&&!memberKey?conditionRows(character):null;
 const members=readCompanions(character),member=linked?members.find((_row,index)=>{try{return companionKey(character,index)===link.key;}catch{return false;}}):null;
 if(linked&&!member)throw new Error('Dieser Begleiter ist dem Hauptcharakter nicht mehr eindeutig zugeordnet. Bitte den Import prüfen.');
 const targetKey=memberKey??(source!==actor&&member?memberStateKey(member):null);
 const resources=stateResources(character).filter(row=>targetKey?row.key===targetKey:source===actor);
 if(memberKey&&!resources.length)throw new Error('Die Begleiterenergien sind nicht eindeutig zugeordnet. Bitte die Liste aktualisieren.');
 if(!conditions&&!resources.length)throw new Error('Für diese Figur sind keine bearbeitbaren Spielwerte vorhanden.');
 const draft=structuredClone(character.localState??{version:1});
 const t=value=>app.t?.(value)??value;
 const warn=message=>{if(app.notify)app.notify('warn',message);else ui.notifications.warn(message);};
 const content=`<p>${e(targetKey?resources[0].name:source.name)} · ${e(t('Änderungen gelten in Foundry. Die Quelldatei bleibt unverändert.'))}</p>${conditions?`<h3>${e(t('Zustände'))}</h3>${conditions.simple.map((row,i)=>`<div class="pp-state-row"><label><input type="checkbox" data-simple="${i}" ${row.IsActive?'checked':''}> ${e(row.Name)}</label><label><input type="checkbox" data-simple-suppression="${i}" ${row.IsSuppressed?'checked':''}> ${e(t('Unterdrückt'))}</label></div>`).join('')}${conditions.complex.map((row,i)=>`<div class="pp-state-row"><label>${e(row.Name)} <input data-complex="${i}" type="number" min="0" max="4" step="1" value="${row.Level}"></label><label>${e(t('Unterdrückung'))} <select data-suppression="${i}">${[[0,'Keine'],[1,'Ganz'],[2,'Eine Stufe'],[3,'Zwei Stufen']].map(([value,label])=>`<option value="${value}" ${row.Suppression===value?'selected':''}>${e(t(label))}</option>`).join('')}</select></label></div>`).join('')}`:''}${resources.map((entry,i)=>`<fieldset><legend>${e(entry.name)}</legend>${entry.resources.map(row=>`<label>${e(row.name)} / ${e(row.max)} <span class="pp-energy-editor"><button type="button" data-energy-step="-1" data-energy-row="${i}" data-energy-name="${row.name}" aria-label="${e(entry.name)} ${row.name} um eins verringern">−</button><input data-resource-row="${i}" data-energy="${row.name}" aria-label="${e(entry.name)} ${row.name}" type="number" min="-100000" max="100000" step="1" value="${e(row.value)}"><button type="button" data-energy-step="1" data-energy-row="${i}" data-energy-name="${row.name}" aria-label="${e(entry.name)} ${row.name} um eins erhöhen">+</button></span></label>`).join('')}</fieldset>`).join('')}<p>${e(t('Nur geänderte Werte werden gespeichert. Plus und Minus werden erst mit Speichern übernommen.'))}</p>`;
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:t('Spielstand · Zustände und Energien')},classes:app.dialogClasses,position:{width:520},modal:true,rejectClose:false,content,
  buttons:[{action:'save',label:t('Speichern'),callback:(_ev,_button,dialog)=>{
   let changed=false;
   if(conditions){const selected=structuredClone(conditions);selected.simple.forEach((row,i)=>{row.IsActive=dialog.element.querySelector(`[data-simple="${i}"]`).checked;row.IsSuppressed=dialog.element.querySelector(`[data-simple-suppression="${i}"]`).checked;});selected.complex.forEach((row,i)=>{row.Level=Number(dialog.element.querySelector(`[data-complex="${i}"]`).value);row.Suppression=Number(dialog.element.querySelector(`[data-suppression="${i}"]`).value);});if(JSON.stringify(selected)!==JSON.stringify(conditions)){draft.conditions=selected;changed=true;}}
   dialog.element.querySelectorAll('[data-resource-row]').forEach(field=>{const entry=resources[Number(field.dataset.resourceRow)],name=field.dataset.energy,value=field.value===''?NaN:Number(field.value);if(value===entry.resources.find(row=>row.name===name).value)return;draft.resources??={};draft.resources[entry.key]??={};draft.resources[entry.key][name]=value;changed=true;});return changed?draft:{refreshOnly:true};
  }},{action:'reset',label:t('Quelldaten verwenden'),callback:()=>{
    if(!targetKey)return {version:1};
    const reset=structuredClone(draft);if(reset.resources)delete reset.resources[targetKey];return reset;
  }},{action:'cancel',label:t('Abbrechen'),callback:()=>false}],render:(_event,dialog)=>{
   dialog.element.querySelectorAll('[data-energy-step]').forEach(button=>button.addEventListener('click',()=>{const field=dialog.element.querySelector(`[data-resource-row="${button.dataset.energyRow}"][data-energy="${button.dataset.energyName}"]`),value=Number(field.value);if(field.value!==''&&Number.isSafeInteger(value))field.value=String(Math.max(-100000,Math.min(100000,value+Number(button.dataset.energyStep))));}));
  }});
 if(!answer||typeof answer!=='object')return;
 if(!actor.isOwner||!actor.canUserModify(game.user,'update'))throw new Error('Zum Ändern werden Besitzerrechte benötigt.');
 if(linkState(actor.getFlag(MODULE_ID,'companion'))!==expectedLink||linked&&(game.actors.get(actor.id)!==actor||game.actors.get(link.sourceActorId)!==source))throw new Error('Die Begleiterzuordnung wurde inzwischen geändert. Bitte den Spielstand erneut öffnen.');
 if(answer.refreshOnly){
  if(!source.isOwner||!source.canUserModify(game.user,'update'))throw new Error('Zum Ändern wird Besitzerrecht am Hauptcharakter benötigt.');
  if(game.actors.get(source.id)!==source||JSON.stringify(getCharacter(source))!==expected)throw new Error('Die Daten wurden inzwischen geändert. Bitte den Spielstand erneut öffnen.');
  await refreshCompanions(source,warn,{localState:true});
 }else await savePlayState(source,answer,expected,warn);
 await app.render({force:true});
}
export async function infoDialog(app,checkId){
 const character=getCharacter(app.actor),check=character?.checks.find(row=>row.id===checkId);if(!check)throw new Error('Die Fähigkeit ist nicht mehr vorhanden.');
 resolveCheck(character,checkReference(check));
 const actorId=app.actorId,key=referenceKey(checkReference(check)),figure=figurePreferences(app.preferences,actorId),t=text=>app.t(text);
 const actionLabel=({attack:'Angriff',parry:'Parade',ranged:'Fernkampf'})[check.combat?.type];
 const title=app.language==='ork'&&actionLabel?`${check.combat.weaponName} · ${t(actionLabel)}`:checkDisplayName(check,app.language),hintId=`pp-note-help-${foundry.utils.randomID()}`;
 const detailLabels=new Set(['Beschreibung','Regeln','Kosten','AE','KE','Dauer','Zauberdauer','Reichweite','Wirkungsdauer','Hinweise','Besonderheiten']);
 const answer=await foundry.applications.api.DialogV2.wait({window:{title},classes:app.dialogClasses,position:{width:480},modal:true,rejectClose:false,
 content:`${title!==check.name?`<p class="pp-original-name">${e(check.name)}</p>`:''}${check.damage?`<p><strong>${e(t('Schaden'))}:</strong> ${e(check.damage)}</p>`:''}${(check.info??[]).map(row=>`<p><strong>${e(detailLabels.has(row.label)?t(row.label):row.label)}</strong><br>${e(row.text)}</p>`).join('')}${check.reason?`<p>${e(check.reason)}</p>`:''}<div class="pp-note-editor"><label>${e(t('Meine Spielnotiz'))}<textarea name="abilityNote" rows="4" maxlength="2000" aria-describedby="${hintId}">${e(figure.notes?.[key])}</textarea></label><div class="pp-note-help" id="${hintId}"><small>${e(t('Strg+Enter: Notiz speichern'))}</small><output data-note-count aria-live="off" aria-label="${e(t('Zeichen'))}"></output></div><p>${e(t('Nur für dich gespeichert. Originaldaten und andere Spieler bleiben unverändert.'))}</p></div>`,
 buttons:[{action:'save',label:t('Notiz speichern'),callback:(_ev,_button,dialog)=>({note:dialog.element.querySelector('[name="abilityNote"]').value})},{action:'cancel',label:t('Schließen'),callback:()=>false}],
 render:(_event,dialog)=>{
  const field=dialog.element.querySelector('[name="abilityNote"]'),counter=dialog.element.querySelector('[data-note-count]');
  const update=()=>{counter.textContent=`${field.value.length} / ${field.maxLength}`;};
  update();field.addEventListener('input',update);field.focus({preventScroll:true});field.setSelectionRange(field.value.length,field.value.length);
  field.addEventListener('keydown',event=>{
   if(event.isComposing||event.repeat||event.key!=='Enter'||!event.ctrlKey&&!event.metaKey||event.altKey||event.shiftKey)return;
   event.preventDefault();event.stopPropagation();dialog.element.querySelector('[data-action="save"]')?.click();
  });
 }});
 if(!answer||typeof answer!=='object')return;
 if(app.actorId!==actorId)throw new Error('Die Figur wurde inzwischen gewechselt.');
 const latest=figurePreferences(app.preferences,actorId);await setFigure(app,{...latest,notes:{...(latest.notes??{}),[key]:answer.note}});
 await app.render({force:true});
}
export async function weaponSetDialog(app){
 const actor=app.actor,character=getCharacter(actor),figure=figurePreferences(app.preferences,actor.id),weapons=weaponChoices(character,{includeUnavailable:true}),t=text=>app.t(text);
 if(!weapons.length&&!figure.weaponSets.length)throw new Error('Keine eindeutig zugeordneten eigenen Waffen vorhanden.');
 const available=new Set(weapons.filter(row=>!row.unavailable).map(row=>row.key));
 const missing=set=>set.weapons.filter(key=>!available.has(key)).map(key=>{try{const name=JSON.parse(key)?.[1];if(typeof name==='string'&&name.trim())return name;}catch{}return t('Unbekannte Waffe');});
 let raw;try{raw=JSON.parse(character.sourceJSON);}catch{}
 const offhands=!raw?.Format?(raw?.ParryWeapons??[]).filter(row=>row.InventoryItemId&&row.OnPerson!==false&&!row.CarrierAnimalId&&(row.Quantity??1)>0&&row.Handedness==='Einhändig'):[];
 const answer=await foundry.applications.api.DialogV2.wait({window:{title:t('Waffensets')},classes:app.dialogClasses,position:{width:500},modal:true,rejectClose:false,
 content:`<p>${e(t('Eigene Auswahl für das Kampfbrett. Alle Begleiter bleiben sichtbar. Entfernte oder mehrdeutige Waffen werden nicht geraten.'))}</p>${figure.weaponSets.map((set,i)=>{const absent=missing(set);return `<div class="pp-set-entry"><label><input type="checkbox" data-remove-set="${i}"> ${e(set.name)} ${e(t('Entfernen'))}</label>${absent.length?`<p class="pp-set-warning">${e(t('Fehlend oder mehrfach vorhanden'))}: ${e([...new Set(absent)].join(', '))}</p>`:''}</div>`;}).join('')}<label>${e(t('Neues Set'))} <input name="setName" maxlength="60" placeholder="${e(t('Zum Beispiel Schwert und Schild'))}"></label>${weapons.map((weapon,i)=>`<label class="pp-set-choice" ${weapon.unavailable?'data-unavailable="true"':''}><input data-set-weapon="${i}" type="checkbox" ${weapon.unavailable?'disabled':''}> <span>${e(weapon.name)}${weapon.unavailable?`<small>${e(t('Gleichnamige Waffen bitte in Pedipalpus eindeutig benennen.'))}</small>`:''}</span></label>`).join('')}${offhands.length&&actor.isOwner?`<label>${e(t('Aktive Nebenhand'))}<select name="setOffHand"><option value="unchanged">${e(t('Unverändert'))}</option><option value="">${e(t('Keine'))}</option>${offhands.map(row=>`<option value="${e(row.InventoryItemId)}">${e(row.Name)}</option>`).join('')}</select></label>`:''}`,
 buttons:[{action:'save',label:t('Speichern'),callback:(_ev,_button,dialog)=>({remove:Array.from(dialog.element.querySelectorAll('[data-remove-set]:checked')).map(field=>Number(field.dataset.removeSet)),name:dialog.element.querySelector('[name="setName"]').value.trim(),weapons:Array.from(dialog.element.querySelectorAll('[data-set-weapon]:checked')).map(field=>weapons[Number(field.dataset.setWeapon)].key),offHand:dialog.element.querySelector('[name="setOffHand"]')?.value??'unchanged'})},{action:'cancel',label:t('Abbrechen'),callback:()=>false}]});
 if(!answer||typeof answer!=='object')return;
 if(app.actorId!==actor.id||game.actors.get(actor.id)!==actor)throw new Error('Die Figur wurde inzwischen gewechselt oder entfernt. Bitte das Waffenset erneut öffnen.');
 const sets=figure.weaponSets.filter((_set,i)=>!answer.remove.includes(i));
 if(answer.name){if(!answer.weapons.length)throw new Error('Bitte mindestens eine Waffe für das neue Set wählen.');const currentKeys=new Set(weaponChoices(getCharacter(actor)).map(row=>row.key));if(answer.weapons.some(key=>!currentKeys.has(key)))throw new Error('Eine ausgewählte Waffe ist inzwischen entfernt oder mehrdeutig. Bitte das Waffenset erneut öffnen.');if(sets.length>=12)throw new Error('Höchstens zwölf Waffensets pro Figur.');sets.push({id:foundry.utils.randomID(),name:answer.name,weapons:answer.weapons,...(answer.offHand!=='unchanged'?{offHand:answer.offHand}:{})});}
 await setFigure(app,{...figure,weaponSets:sets,activeSet:sets.some(set=>set.id===figure.activeSet)?figure.activeSet:''});await app.render({force:true});
}
export async function activateWeaponSet(app,id){
 const actor=app.actor;
 const figure=figurePreferences(app.preferences,app.actorId),set=figure.weaponSets.find(row=>row.id===id);
 if(id&&!set)throw new Error('Dieses Waffenset ist nicht mehr vorhanden.');
 const character=getCharacter(app.actor),keys=new Set(weaponChoices(character).map(row=>row.key));
 if(set&&set.weapons.some(key=>!keys.has(key)))throw new Error('Eine Waffe fehlt oder ist mehrdeutig. Bitte das Set neu anlegen.');
 if(set?.offHand!==undefined){if(!app.actor.isOwner)throw new Error('Zum Wechseln der Nebenhand werden Besitzerrechte benötigt.');await savePlayState(app.actor,{...(character.localState??{version:1}),offHand:set.offHand},JSON.stringify(character));}
 if(app.actorId!==actor.id||game.actors.get(actor.id)!==actor)throw new Error('Die Figur wurde inzwischen gewechselt oder entfernt. Bitte das Waffenset erneut öffnen.');
 await setFigure(app,{...figure,activeSet:id});
}
