import { MODULE_ID } from './data.js';
import { PedipalpusApp } from './app.js';
let application;
export function openPedipalpus(actorId = null) {
  application ??= new PedipalpusApp();
  return application.open(actorId);
}

Hooks.once('init', () => {
  game.settings.register(MODULE_ID, 'theme', { scope: 'client', config: false, type: String, default: 'dark' });
  game.settings.registerMenu(MODULE_ID, 'open', {
    name: 'Pedipalpus – Charaktere', label: 'Charaktere öffnen',
    hint: 'JSON-Datei importieren, einen Charakter auswählen und direkt würfeln.',
    icon: 'fa-solid fa-dice-d20', type: PedipalpusApp, restricted: false
  });
  game.modules.get(MODULE_ID).api = Object.freeze({ open: openPedipalpus, version: game.modules.get(MODULE_ID).version });
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
    if (app instanceof PedipalpusApp && app.rendered && !app.changes.length && !app.inputDirty && (!actorId || app.actorId === actorId)) {
      app.render({ force: true }).catch(error => console.error(MODULE_ID, error));
    }
  }
}
Hooks.on('updateActor', actor => refreshWindows(actor.id));
Hooks.on('deleteActor', actor => refreshWindows(actor.id));
Hooks.on('createActor', () => refreshWindows());
Hooks.on('controlToken', () => refreshWindows());
Hooks.on('updateToken', () => refreshWindows());
Hooks.on('canvasReady', () => refreshWindows());

// Zusätzlich zum Verzeichnisbutton kann ein Makro diese öffentliche API öffnen:
// game.modules.get('pedipalpus-foundry').api.open();
