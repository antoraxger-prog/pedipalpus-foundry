// Ausschließlich für die lokale Browserprüfung; gehört nicht in das Installationspaket.
const callbacks = new Map();
window.Hooks = {
  once(name, callback) { this.on(name, callback); },
  on(name, callback) { if (!callbacks.has(name)) callbacks.set(name, []); callbacks.get(name).push(callback); },
  call(name, ...args) { for (const callback of callbacks.get(name) ?? []) callback(...args); },
  async callAsync(name,...args) { return Promise.all((callbacks.get(name) ?? []).map(callback=>callback(...args))); }
};
class ApplicationV2 {
  static windows = new Map();
  static *instances() { yield* this.windows.values(); }
  constructor(options={}) { this.options={...this.constructor.DEFAULT_OPTIONS,...options};this.position={...this.constructor.DEFAULT_OPTIONS?.position,...options.position};this.element = document.createElement('section'); this.element.className = (this.options.classes ?? []).join(' '); this.element.id = this.options.id || 'test-dialog'; }
  async render() {
    if (!this.element.isConnected) document.querySelector('#app').append(this.element);
    this.setPosition(this.position);
    this.element.innerHTML = '<div class="window-content" style="height:100%"></div>';
    this._replaceHTML(await this._renderHTML(), this.element.firstElementChild);
    this.rendered = true;
    ApplicationV2.windows.set(this.element.id, this);
    return this;
  }
  bringToFront() {}
  setPosition(position={}) { Object.assign(this.position,position);this.element.style.width=`min(${this.position.width}px, 100%)`;this.element.style.height=`${this.position.height}px`;return this.position; }
  async close() {this.element.remove();this.rendered=false;ApplicationV2.windows.delete(this.element.id);return this;}
}
class DialogV2 {
  static async wait(config) {
    return new Promise(resolve => {
      const element = document.createElement('section');
      element.className = 'mock-dialog ' + (config.classes ?? []).join(' ');
      element.innerHTML = `<h2></h2><form>${config.content}<footer></footer></form>`;
      // DialogV2 entfernt Canvas aus dem übergebenen HTML, bevor der Render-Callback läuft.
      element.querySelectorAll('canvas').forEach(canvas=>canvas.remove());
      element.querySelector('h2').textContent = config.window?.title || 'Dialog';
      const dialog = { element };
      for (const spec of config.buttons) {
        const button = document.createElement('button');
        button.type = 'button'; button.dataset.action = spec.action; button.textContent = spec.label; button.disabled = spec.disabled === true;
        button.addEventListener('click', async event => {
          try {const answer = spec.callback ? await spec.callback(event, button, dialog) : spec.action; element.remove(); resolve(answer);}
          catch(error){ui.notifications.error(error.message);}
        });
        element.querySelector('footer').append(button);
      }
      document.body.append(element);
      config.render?.(new Event('render'), dialog);
    });
  }
  static input(config) {
    return this.wait({ ...config, buttons: [{ action: 'ok', label: 'Würfeln', callback: (_event, _button, dialog) => {
      const data = Object.fromEntries(new FormData(dialog.element.querySelector('form')));
      return data;
    } }, { action: 'cancel', label: 'Abbrechen', callback: () => null }] });
  }
  static confirm(config) { return this.wait({ ...config, buttons: [{ action: 'yes', label: 'Verknüpfen', callback: () => true }, { action: 'no', label: 'Abbrechen', callback: () => false }] }); }
}
const settings = new Map();
const settingKey = (namespace,key) => `pp-preview.${settings.get(namespace+'.'+key)?.scope === 'user' ? game.user.id : 'client'}.${namespace}.${key}`;
window.game = {
  version:'14.368',system: { id: 'worldbuilding' }, world: {id:'test-world'}, scenes:{contents:[]}, user: { id: sessionStorage.getItem('preview-user') || 'player', isGM: false, can:() => true,async assignHotbarMacro(macro,slot){window.testHotbar.push({macro,slot});} }, users: [{ id: 'gm', isGM: true }],
  keybindings:{bindings:new Map(),register(namespace,key,config){this.bindings.set(`${namespace}.${key}`,config);}},
  actors: { contents: [], get(id) { return this.contents.find(actor => actor.id === id); } },
  modules: new Map([['ucurifunke-checks', { active: true, version: window.previewChecksVersion }], ['pedipalpus-foundry', {}]]),
  settings: { registerMenu() {}, register(namespace, key, config) { settings.set(namespace + '.' + key, config); }, get(namespace, key) { const value=localStorage.getItem(settingKey(namespace,key)); return value === null ? settings.get(namespace+'.'+key)?.default : JSON.parse(value); }, async set(namespace, key, value) { localStorage.setItem(settingKey(namespace,key),JSON.stringify(value)); } }
};
window.canvas = { tokens: { controlled: [] } };
window.CONST = { DOCUMENT_OWNERSHIP_LEVELS: { OWNER: 3 }, CHAT_MESSAGE_STYLES: { OTHER: 0 } };
window.testMessages = [];
window.notifications = [];
window.testMacros=[];window.testHotbar=[];
window.foundry = {
  applications: { api: { ApplicationV2, DialogV2 }, sidebar: { tabs: { ChatLog: { CHAT_COMMANDS: {} } } },apps:{FilePicker:{implementation:{
    async browse() {return {dirs:['worlds/test-world/pedipalpus-portraits'],files:[]};},
    async upload(_source,path,file) { const target=`${path}/${file.name}`;const response=await fetch(`/preview-upload?path=${encodeURIComponent(target)}`,{method:'POST',body:file});if(!response.ok)throw new Error('Preview upload failed');return {path:target}; }
  }}} },
  utils: { isNewerVersion: (a, b) => a.localeCompare(b, undefined, { numeric: true }) > 0, escapeHTML: value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) },
  dice: { Roll: class { constructor(formula) {this.formula=formula;} async evaluate() { this.dice = [{ faces: 20, results: (this.formula === '1d20' ? [10] : [17, 10, 16]).map(result => ({ result })) }]; return this; } } },
  documents: {
    Macro:{canUserCreate:()=>true,async create(data){const macro={...data,id:`macro-${window.testMacros.length+1}`};window.testMacros.push(macro);return macro;}},
    Actor: { canUserCreate: () => true, async create(data) {
      const actor = { ...data, id: 'actor-' + (game.actors.contents.length + 1), isOwner: true,
        async update(values) {for(const[key,value]of Object.entries(values)){const parts=key.split('.');let target=this;for(const part of parts.slice(0,-1))target=target[part]??={};target[parts.at(-1)]=value;}Hooks.call('updateActor',this);},
        testUserPermission: () => true, canUserModify: () => true,
        getFlag(namespace, key) { return this.flags[namespace]?.[key]; },
        async setFlag(namespace, key, value) { this.flags[namespace] ??= {}; this.flags[namespace][key] = structuredClone(value); Hooks.call('updateActor', this); }
      };
      game.actors.contents.push(actor); Hooks.call('createActor', actor); return actor;
    } },
    ChatMessage: { getSpeaker: ({ actor, token, scene } = {}) => ({ actor: actor?.id, token: token?.id, scene: scene?.id }),
      applyMode(data, mode) { data.testModeApplied = true; data.testMode = mode; }, async create(data) { testMessages.push(data); } }
  }
};
window.ui = { notifications: Object.fromEntries(['info', 'warn', 'error'].map(level => [level, message => { notifications.push({ level, message }); document.querySelector('#notice').textContent = message; }])), chat: {
  async processMessage(command, options) {
    for (const [key, handler] of Object.entries(foundry.applications.sidebar.tabs.ChatLog.CHAT_COMMANDS)) {
      const match = command.match(handler.rgx);
      if (match) return handler.fn(key, match, options);
    }
    throw new Error('Unknown command');
  }
} };
await import('/checks-reference.js');
await import('/scripts/main.js');
Hooks.call('init'); Hooks.call('ready');
await game.modules.get('pedipalpus-foundry').api.open();
window.previewReady = true;
