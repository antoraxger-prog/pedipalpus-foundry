import { registerTokenSettings } from './tokens.js';
import { MODULE_ID } from './data.js';
import { PedipalpusApp } from './app.js';
import { registerDesignSettings } from './design.js';
import { loadWorkbench, registerWorkbenchSettings, checkReference, resolveCheck, recordRecent, saveWorkbench } from './workbench.js';
import { getCharacter } from './storage.js';
import { executeCheck } from './commands.js';
import { playFeedback } from './feedback.js';
let application;
let macroBusy=false;
let pointer={x:300,y:250};
export function openPedipalpus(actorId = null) {
  application ??= new PedipalpusApp();
  return application.open(actorId);
}

export async function rollPedipalpus({actorId,reference,blind=false,modifier}={}) {
  if(application?.rendered)return application.rollReference(actorId,reference,{blind,modifier});
  if(macroBusy)throw new Error('Bitte die laufende Aktion abwarten.');
  macroBusy=true;
  try{
    const actor=game.actors.get(actorId),check=resolveCheck(getCharacter(actor),reference);
    const token=canvas.tokens?.controlled?.map(placeable=>placeable.document).find(token=>token.actorId===actorId&&token.actorLink) || null;
    await executeCheck(actor,check,token,{modifier:modifier??0,blind});
    const prefs=recordRecent(loadWorkbench(),actorId,check);
    await saveWorkbench(prefs);
    playFeedback('roll',{...prefs,theme:game.settings.get(MODULE_ID,'design')||'fantasy'}).catch(error=>console.warn(MODULE_ID,error));
  }finally{macroBusy=false;}
}

async function createRollMacro(data,slot){
  if(!Number.isSafeInteger(slot)||slot<1||slot>50)throw new Error('Dieser Makroplatz ist ungültig.');
  const actor=game.actors.get(data.actorId);
  if(!actor?.isOwner)throw new Error('Zum Würfeln werden Besitzerrechte benötigt.');
  const check=resolveCheck(getCharacter(actor),data.reference);
  if(!foundry.documents.Macro.canUserCreate(game.user))throw new Error('Dein Meister muss das Erstellen von Makros erlauben.');
  const payload={actorId:actor.id,reference:checkReference(check),blind:data.blind===true};
  const macro=await foundry.documents.Macro.create({name:check.name,type:'script',img:'icons/svg/d20.svg',command:`await game.modules.get(${JSON.stringify(MODULE_ID)}).api.roll(${JSON.stringify(payload)});`,ownership:{[game.user.id]:CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER}});
  await game.user.assignHotbarMacro(macro,slot);
}

Hooks.once('init', () => {
  registerDesignSettings();registerTokenSettings();
  registerWorkbenchSettings();
  game.settings.registerMenu(MODULE_ID, 'open', {
    name: 'Pedipalpus – Proben', label: 'Proben öffnen',
    hint: 'JSON-Datei importieren, einen Charakter auswählen und direkt würfeln.',
    icon: 'fa-solid fa-dice-d20', type: PedipalpusApp, restricted: false
  });
  game.modules.get(MODULE_ID).api = Object.freeze({ open: openPedipalpus, roll:rollPedipalpus, version: game.modules.get(MODULE_ID).version });
  const shortcut=(action)=>{
    const element=document.activeElement;
    if(element?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(element?.tagName))return false;
    openPedipalpus().then(app=>action(app)).catch(error=>ui.notifications.error(error.message));return true;
  };
  game.keybindings?.register(MODULE_ID,'open',{name:'Pedipalpus öffnen und suchen',editable:[],onDown:()=>shortcut(app=>app.setMode('full').then(()=>app.element.querySelector('[name="search"]')?.focus()))});
  game.keybindings?.register(MODULE_ID,'ring',{name:'Pedipalpus-Probenring',editable:[],onDown:()=>shortcut(app=>app.setMode('ring',pointer))});
  game.keybindings?.register(MODULE_ID,'battle',{name:'Pedipalpus-Kampfbrett',editable:[],onDown:()=>shortcut(app=>app.setMode('battle'))});
});

Hooks.once('ready',()=>document.addEventListener('pointermove',event=>{pointer={x:event.clientX,y:event.clientY};},{passive:true}));
Hooks.on('hotbarDrop',(_bar,data,slot)=>{
  if(data?.type!=='PedipalpusCheck')return;
  createRollMacro(data,slot).catch(error=>ui.notifications.error(error.message));return false;
});

Hooks.on('renderActorDirectory', (_app, html) => {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root || root.querySelector('.pp-directory-button')) return;
  const host = root.querySelector('.directory-header') ?? root.querySelector('.header-actions');
  if (!host) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'pp-directory-button';
  button.innerHTML = '<i class="fa-solid fa-dice-d20" aria-hidden="true"></i> Pedipalpus';
  button.addEventListener('click', () => openPedipalpus().catch(error => ui.notifications.error(error.message)));
  host.append(button);
});

function refreshWindows(actorId = null) {
  for (const app of foundry.applications.api.ApplicationV2.instances()) {
    if (app instanceof PedipalpusApp && app.rendered && (!actorId || app.actorId === actorId)) {
      app.render({ force: true }).catch(error => console.error(MODULE_ID, error));
    }
  }
}
Hooks.on('updateActor', actor => refreshWindows(actor.id));
Hooks.on('deleteActor', actor => refreshWindows(actor.id));
Hooks.on('createActor', () => refreshWindows());
Hooks.on('controlToken', () => {
  if(application?.rendered && !application.busy && !application.referenceBusy && application.preferences.followToken){
    const selected=canvas.tokens?.controlled || [],actor=selected.length===1&&selected[0].document.actorLink?game.actors.get(selected[0].document.actorId):null;
    if(actor?.isOwner && getCharacter(actor)){application.open(actor.id).catch(error=>ui.notifications.error(error.message));return;}
  }
  refreshWindows();
});
Hooks.on('updateToken', () => refreshWindows());
Hooks.on('canvasReady', () => refreshWindows());

// Zusätzlich zum Verzeichnisbutton kann ein Makro diese öffentliche API öffnen:
// game.modules.get('pedipalpus-foundry').api.open();
