import { NPC_FORMAT,retainNpcChoices,withNpcAttributes } from './npc.js';
import { rememberImportSource,importSource,directoryCharacters,readLiveSource } from './import-source.js';
import { parseCharacter, MODULE_ID } from './data.js';
import { connectionStatus, executeCheck } from './commands.js';
import { getCharacter, visibleActors, saveCharacter, linkToken, saveFocus, saveArmorState,ownerAssignment } from './storage.js';
import { renderView, renderImportOptions, updateFocusView, renderCompanionImportOptions, escapeHTML, checksForView } from './view.js';
import { withFocus, characterFocus } from './combat.js';
import { preparePortrait, uploadPortrait, applyPortrait, framingFor } from './portraits.js';
import { savedDesign, initializeDesign, saveDesign, THEMES } from './design.js';
import { uiText, localizeSurface, localizeDialog } from './language.js';
import { loadWorkbench, saveWorkbench, validateWorkbench, checkReference, referenceKey, resolveCheck, toggleFavorite, moveFavorite, recordRecent } from './workbench.js';
import { compareCharacters } from './import-diff.js';
import { playFeedback, notifyFeedback, prepareFeedback } from './feedback.js';
import { COMPANION_GROUPS,isCompanionCheck,memberAttributes,withCompanionAttributes,retainCompanionChoices,withCompanionImport } from './retinue.js';
import { companionEntries,companionKey,companionActor,saveCompanion,companionTargetState,prepareCompanionImport,verifyCompanionImport,applyCompanionImport } from './companions.js';
import { characterFiles, readCharacterWithPortrait } from './character-folder.js';
import { tokenStyles, importCustomFrame, savedFrames, prepareTokenPortrait, tokenFromActor, importTokenFrames, savedPortraitFraming, portraitFromActor } from './tokens.js';
import { writeCharacterBundle } from './bundle.js';
import {PortraitEditor,portraitEditorHTML,customFrameImportHTML,fillFrameOptions} from './portrait-editor.js';
import { checkDisplayName } from './ork-talents.js';

const { ApplicationV2, DialogV2 } = foundry.applications.api;
export class PedipalpusApp extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    classes: ['pedipalpus-app'], tag: 'section',
    window: { title: 'Pedipalpus – Proben', icon: 'fa-solid fa-dice-d20', resizable: true },
    position: { width: 540, height: 520 }
  };
  constructor(options = {}) {
    super(options);
    this.actorId = null;
    this.search = '';
    this.category = 'all';
    this.theme = savedDesign();
    this.designSave = Promise.resolve();
    this.busy = false;
    this.referenceBusy = false;
    this.modifier = 0;
    this.modifierDirection = 1;
    this.focusSave = Promise.resolve();
    this.focusError = null;
    this.preferences = loadWorkbench();
    this.actorId = this.preferences.actorId;
    this.category = this.preferences.category;
    this.preferenceSave = Promise.resolve();
    this.administration = false;
    this.mode = 'full';
    this.fullPosition = null;
  }
  get dialogClasses() { const design={dark:'pp-dark-dialog',light:'pp-light-dialog',ork:'pp-ork-dialog',demonic:'pp-demonic-dialog',aristocrat:'pp-aristocrat-dialog',warrior:'pp-warrior-dialog',arcane:'pp-arcane-dialog',sneaky:'pp-sneaky-dialog'}[this.theme];return ['pedipalpus-dialog',...(design?[design]:[])]; }
  get language() { return this.preferences.language === 'theme' ? this.theme === 'ork' ? 'ork' : 'standard' : this.preferences.language; }
  get effects() { return {...this.preferences, theme:this.theme, animations:{none:'off',subtle:'subtle',full:'lively'}[this.preferences.animations]}; }
  get actor() { return this.actorId ? game.actors.get(this.actorId) : null; }
  get token() {
    return canvas.tokens?.controlled?.map(placeable => placeable.document)
      .find(token => token.actorId === this.actorId && token.actorLink) ?? null;
  }
  async open(actorId = null) {
    if((this.busy || this.referenceBusy) && actorId && actorId!==this.actorId)throw new Error('Bitte die laufende Aktion abwarten.');
    await this.designSave;
    try { await initializeDesign(); } catch (error) { console.error(MODULE_ID,error); this.notify('warn','Das Design konnte nicht gespeichert werden.'); }
    this.theme = savedDesign();
    if (actorId && actorId !== this.actorId) this.selectActor(actorId);
    else if (!this.actorId) {
      const controlled = canvas.tokens?.controlled?.[0]?.document;
      const actor = controlled?.actorLink && game.actors.get(controlled.actorId);
      this.actorId = actor && getCharacter(actor) ? actor.id
        : visibleActors().find(actor => actor.isOwner && getCharacter(actor))?.id ?? null;
    }
    await this.render({ force: true });
    if (!this.fullPosition && this.mode === 'full') {
      const saved = game.settings.get(MODULE_ID,'windowState')?.[game.user.id];
      if (saved) this.setPosition(this.safePosition(saved));
      this.fullPosition = this.position ? {...this.position} : null;
    }
    await this.persist({...this.preferences,actorId:this.actorId,category:this.category});
    this.bringToFront();
    return this;
  }
  async _renderHTML() {
    const actors = visibleActors();
    const actor = actors.find(actor => actor.id === this.actorId) ?? null;
    if (!actor) this.actorId = null;
    if(actor?.getFlag(MODULE_ID,'companion')?.sourceActorId)this.mode='battle';
    const current = getCharacter(actor);
    if(this.mode==='full' && !['all','favorites'].includes(this.category)){
      const available=new Set(checksForView(current,'full').map(check=>['primary','secondary'].includes(check.id.split(':')[0])?'attributes':['Spells','Rituals'].includes(check.id.split(':')[0])?'magic':check.id.split(':')[0]));
      if(!available.has(this.category))this.category='all';
    }
    const keys = type => (this.preferences[type][actor?.id] ?? []).flatMap(ref => {
      try { return [resolveCheck(current,ref).id]; } catch { return []; }
    });
    return renderView({ actors: actors.map(item => ({ id: item.id, name: item.name, hasCharacter: !!getCharacter(item),npc:getCharacter(item)?.sourceFormat===NPC_FORMAT })),
      actor, character: getCharacter(actor), status: connectionStatus(),
      canImport: actors.some(actor => actor.canUserModify(game.user, 'update')) || foundry.documents.Actor.canUserCreate(game.user),
      token: this.token, canLinkToken: actor?.isOwner && !this.token && canvas.tokens?.controlled?.length === 1,
      search: this.search, category: this.category, theme: this.theme, modifier: this.modifier, modifierDirection: this.modifierDirection, busy: this.busy || this.referenceBusy,
      preferences:{...this.preferences,language:this.language}, administration:this.administration, mode:this.mode, favoriteKeys:keys('favorites'), recentKeys:keys('recent') });
  }
  _replaceHTML(result, content) {
    this.element.dataset.ppTheme = this.theme;
    content.innerHTML = result;
    this.companionOpen??=new Map();
    content.querySelectorAll('[data-companion-section]').forEach(section=>{const key=JSON.stringify([this.actorId,section.dataset.companionSection]);section.open=this.companionOpen.get(key)??Boolean(getCharacter(this.actor)?.profile.companionGroup);section.querySelector('summary').addEventListener('click',()=>requestAnimationFrame(()=>this.companionOpen.set(key,section.open)));});
    if(this.audioElement!==content){
      this.audioElement=content;
      const prepare=()=>{prepareFeedback(this.effects);};
      content.addEventListener('pointerdown',prepare,{passive:true});
      content.addEventListener('keydown',prepare);
    }
    if(globalThis.navigator?.userActivation?.isActive)prepareFeedback(this.effects);
    if(!this.geometryObserver && globalThis.MutationObserver){
      const remember=()=>{clearTimeout(this.geometryTimer);this.geometryTimer=setTimeout(()=>this.rememberWindow().catch(error=>console.warn(MODULE_ID,error)),160);};
      this.geometryObserver=new MutationObserver(remember);this.geometryObserver.observe(this.element,{attributes:true,attributeFilter:['style']});
      if(globalThis.ResizeObserver){this.sizeObserver=new ResizeObserver(remember);this.sizeObserver.observe(this.element);}
    }
    const title = this.element.querySelector('.window-title');
    if (title) title.textContent = this.mode==='battle' ? 'Pedipalpus – Kampf' : 'Pedipalpus – Proben';
    const root = content.querySelector('.pp-root');
    if (root) { root.dataset.language = this.language; root.dataset.animation = this.preferences.animations;root.dataset.ppAnimations=this.effects.animations; }
    if(root && this.characterChanged){if(this.preferences.animations!=='none')root.classList.add('pp-sheet-changed');this.characterChanged=false;}
    localizeSurface(this.element, this.language === 'ork' ? 'ork' : 'fantasy', getCharacter(this.actor), this.actor, this.token);
    content.querySelector('[name="actor"]').addEventListener('change', async event => {
      if (this.busy || this.referenceBusy) return;
      this.selectActor(event.target.value || null);
      await this.persist({...this.preferences,actorId:this.actorId,category:this.category});
      await this.render({ force: true });
    });
    content.querySelector('[name="search"]')?.addEventListener('input', event => {
      this.search = event.target.value;
      this.filterChecks(content);
    });
    content.querySelector('[name="theme"]')?.addEventListener('change', event => {
      this.theme = THEMES.includes(event.target.value) ? event.target.value : 'fantasy';
      const theme = this.theme;
      this.designSave = this.designSave.then(() => saveDesign(theme)).catch(error => {
        console.error(MODULE_ID,error); this.notify('error','Das Design konnte nicht gespeichert werden.');
      });
      this.render({force:true}).catch(error => console.error(MODULE_ID,error));
    });
    content.querySelector('[name="category"]')?.addEventListener('change', event => {
      this.category = event.target.value;
      this.search = '';
      content.querySelector('[name="search"]').value = '';
      this.filterChecks(content);
      if(this.mode==='full')this.persist({...this.preferences,category:this.category}).catch(error => this.notify('error',error.message));
    });
    content.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => { if(!button.disabled && button.dataset.dragging!=='true')this.onAction(button); }));
    content.querySelectorAll('.pp-check-name').forEach(name => {
      name.draggable = true;
      name.addEventListener('dragstart',event => {
        const check = getCharacter(this.actor)?.checks.find(check => check.id === name.closest('[data-check-id]')?.dataset.checkId);
        if (!check || !this.actor?.isOwner) { event.preventDefault(); return; }
        name.dataset.dragging='true';
        event.dataTransfer.setData('text/plain',JSON.stringify({type:'PedipalpusCheck',actorId:this.actorId,reference:checkReference(check)}));
      });
      name.addEventListener('dragend',()=>setTimeout(()=>delete name.dataset.dragging,0));
    });
    content.addEventListener('keydown',event => {
      if (event.target.name !== 'search') return;
      if (event.key === 'Escape') { event.preventDefault(); event.target.value='';this.search='';this.filterChecks(content); }
      if (event.key === 'ArrowDown') { event.preventDefault(); content.querySelector('.pp-check-row:not([hidden]) [data-action="roll"]:not([disabled])')?.focus(); }
    });
    const focus = content.querySelector('[name="focus"]');
    let previousFocus=Number(focus?.value);
    focus?.addEventListener('input', () => {
      if (this.busy || this.referenceBusy) return;
      updateFocusView(content, withFocus(getCharacter(this.actor), Number(focus.value)));
      if(Number(focus.value)!==previousFocus){previousFocus=Number(focus.value);this.sound('dial');}
    });
    focus?.addEventListener('change', () => {
      if (this.busy || this.referenceBusy) return;
      const actor = this.actor;
      const value = Number(focus.value);
      this.focusSave = this.focusSave.then(() => saveFocus(actor, value)).then(() => {
        if (this.actorId === actor.id) this.focusError = null;
        this.feedback('focusChanged','Fokus gespeichert.');
        const checks=getCharacter(actor)?.checks || [];
        this.element.querySelectorAll('.pp-check-row').forEach(row=>{
          const check=checks.find(check=>check.id===row.dataset.checkId);
          if(check?.kind==='combat'&&!isCompanionCheck(check)&&!check.fixedCombat&&check.combat.type!=='ranged'){
            const rating=row.querySelector('.pp-rating');rating?.classList.add('pp-changed-value');setTimeout(()=>rating?.classList.remove('pp-changed-value'),320);
          }
        });
        this.sound('focus');
      }).catch(error => {
        if (this.actorId === actor.id) this.focusError = error;
        this.notify('error', error.message || 'Der Fokus konnte nicht gespeichert werden.');
        this.render({force:true}).catch(error => console.error(MODULE_ID,error));
      });
    });
    const modifier = content.querySelector('[name="modifier"]');
    modifier?.addEventListener('input', () => {
      const value = modifier.value === '' ? 0 : Number(modifier.value);
      if (value < 0) this.modifierDirection = -1;
      this.modifier = Math.abs(value) * this.modifierDirection;
      this.updateModifier(content, false);
      if (value < 0) modifier.value = String(Math.abs(value));
      if(Number.isSafeInteger(this.modifier))this.sound('dial');
    });
    const wheel = event => {
      if (!event.deltaY || modifier.disabled) return;
      event.preventDefault();
      const value = this.modifier;
      this.modifier = (Number.isSafeInteger(value) ? value : 0) + (event.deltaY < 0 ? 1 : -1);
      this.updateModifier(content);
      this.sound('dial');
    };
    content.querySelector('.pp-wheel-hint')?.addEventListener('wheel',wheel,{passive:false});
    content.querySelectorAll('[data-modifier-step]').forEach(step=>step.addEventListener('click',()=>{if(modifier.disabled || this.busy || this.referenceBusy)return;const value=(Number.isSafeInteger(this.modifier)?this.modifier:0)+Number(step.dataset.modifierStep);if(!Number.isSafeInteger(value))return;this.modifier=value;this.updateModifier(content);this.sound('dial');}));
    modifier?.addEventListener('wheel',wheel,{passive:false});
    content.querySelector('[name="modifierDirection"]')?.addEventListener('wheel',wheel,{passive:false});
    content.querySelector('[name="modifierDirection"]')?.addEventListener('click', () => {
      this.modifierDirection *= -1;
      this.modifier = Math.abs(this.modifier) * this.modifierDirection;
      this.updateModifier(content);
      this.sound('dial');
    });
    content.querySelectorAll('[data-armor]').forEach(field=>field.addEventListener('change',async()=>{if(this.busy||this.referenceBusy)return;this.busy=true;field.disabled=true;try{await saveArmorState(this.actor,field.dataset.armor,field.dataset.armorField,field.checked);}catch(error){this.notify('error',error.message);}finally{this.busy=false;await this.render({force:true});}}));
    this.filterChecks(content);
  }
  t(text) { return uiText(this.language === 'ork' ? 'ork' : 'fantasy',text); }
  notify(level, text) { ui.notifications[level](this.t(text)); }
  feedback(event,text) { notifyFeedback(this.element.querySelector('.pp-root') || this.element,event,`${['saved','focusChanged'].includes(event)?'✓ ':''}${this.t(text)}`,this.effects); }
  sound(event) { playFeedback(event,this.effects).catch(error => console.warn(MODULE_ID,error)); }
  persist(prefs) {
    this.preferences = validateWorkbench(prefs);
    const snapshot = this.preferences;
    this.preferenceSave = this.preferenceSave.catch(() => {}).then(() => saveWorkbench(snapshot));
    return this.preferenceSave;
  }
  selectActor(id) {
    this.characterChanged=this.actorId!==id;
    this.actorId=id; this.search=''; this.category='all';this.focusError=null;this.modifier=0;this.modifierDirection=1;
  }
  safePosition(position) {
    const width=Math.max(360,Math.min(Number(position.width)||540,Math.max(360,globalThis.innerWidth||1280)));
    const height=Math.max(320,Math.min(Number(position.height)||520,Math.max(320,globalThis.innerHeight||800)));
    return {width,height,left:Math.max(0,Math.min(Number(position.left)||0,(globalThis.innerWidth||1280)-width)),top:Math.max(0,Math.min(Number(position.top)||0,(globalThis.innerHeight||800)-height))};
  }
  async rememberWindow() {
    if (this.mode === 'ring') return;
    const rect=this.element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.fullPosition={width:rect.width,height:rect.height,left:rect.left,top:rect.top};
    const existing=game.settings.get(MODULE_ID,'windowState') || {};
    await game.settings.set(MODULE_ID,'windowState',{...existing,[game.user.id]:this.fullPosition});
  }
  async close(options) { clearTimeout(this.geometryTimer);this.geometryObserver?.disconnect();this.sizeObserver?.disconnect();this.geometryObserver=null;this.sizeObserver=null;await this.rememberWindow();await this.preferenceSave.catch(()=>{});return super.close(options); }
  async setMode(mode,point=null) {
    if (!['full','battle','ring'].includes(mode)) return;
    const previousMode=this.mode;
    if (previousMode!=='ring') await this.rememberWindow();
    this.mode=mode;
    if (mode !== 'full') this.administration=false;
    this.category=mode==='full'?this.preferences.category:'all';this.search='';
    await this.render({force:true});
    if (mode==='ring') this.setPosition(this.safePosition({width:510,height:640,left:point?.x?point.x-255:80,top:point?.y?point.y-240:100}));
    else if (previousMode==='ring' && this.fullPosition) this.setPosition(this.safePosition(this.fullPosition));
  }
  updateModifier(content = this.element, updateValue = true) {
    const field = content.querySelector('[name="modifier"]');
    if (!field) return;
    if (this.modifier) this.modifierDirection = this.modifier < 0 ? -1 : 1;
    if (updateValue) field.value = Number.isSafeInteger(this.modifier) ? String(Math.abs(this.modifier)) : '';
    field.dataset.mode = this.modifier === 0 ? 'neutral' : this.modifierDirection < 0 ? 'relief' : 'difficulty';
    const label = this.t(this.modifierDirection < 0 ? 'Erleichterung' : 'Erschwernis');
    field.setAttribute('aria-label', label);
    const direction = content.querySelector('[name="modifierDirection"]');
    if (direction) direction.textContent = label;
  }
  filterChecks(content = this.element) {
    const query = this.search.trim().toLocaleLowerCase('de');
    const armorView=this.mode==='battle'&&this.category==='armors'&&!query;
    content.querySelector('.pp-check-list')?.toggleAttribute('hidden',armorView);
    content.querySelector('.pp-focus')?.toggleAttribute('hidden',armorView);
    let visibleMembers=0;
    content.querySelector('[data-inventory="armors"]')?.toggleAttribute('hidden',!armorView);
    let count = 0;
    const scales = new Set();
    content.querySelectorAll('.pp-check-row').forEach(row => {
      row.hidden = query ? !row.dataset.search.includes(query) : this.mode==='ring' ? false : this.category === 'favorites' ? row.dataset.favorite !== 'true'
        : this.category === 'recent' ? row.dataset.recent !== 'true' : this.category !== 'all' && row.dataset.category !== this.category;
      if (!row.hidden) { count++; scales.add(row.dataset.scale); }
    });
    content.querySelectorAll('.pp-weapon-header,.pp-talent-header').forEach(header => {
      const ids=JSON.parse(header.dataset.checkIds || '[]');
      header.hidden=!Array.from(content.querySelectorAll('.pp-check-row')).some(row => ids.includes(row.dataset.checkId) && !row.hidden);
    });
    content.querySelectorAll('.pp-talent-child').forEach(row=>row.classList.remove('pp-talent-first','pp-talent-last'));
    content.querySelectorAll('.pp-talent-header:not([hidden])').forEach(header=>{const rows=Array.from(content.querySelectorAll('.pp-talent-child')).filter(row=>!row.hidden&&row.dataset.talentGroup===header.dataset.talentGroup);rows[0]?.classList.add('pp-talent-first');rows.at(-1)?.classList.add('pp-talent-last');});
    content.querySelectorAll('[data-companion-section]').forEach(section=>{
      const card=section.querySelector('[data-companion-card]'),rows=Array.from(section.querySelectorAll('.pp-check-row'));
      const match=Boolean(query&&card.dataset.search.includes(query));
      if(match)rows.forEach(row=>{row.hidden=false;});
      section.hidden=armorView||!(rows.some(row=>!row.hidden)||!query&&(this.category==='all'||this.category===section.dataset.inventory));
      card.hidden=false;
      if(!section.hidden)visibleMembers++;
      section.open=query&&!section.hidden?true:(this.companionOpen?.get(JSON.stringify([this.actorId,section.dataset.companionSection]))??Boolean(getCharacter(this.actor)?.profile.companionGroup));
      section.querySelectorAll('.pp-weapon-header').forEach(header=>{const ids=JSON.parse(header.dataset.checkIds||'[]');header.hidden=!rows.some(row=>!row.hidden&&ids.includes(row.dataset.checkId));});
    });
    const overviews=content.querySelector('.pp-companion-overviews');if(overviews)overviews.hidden=!visibleMembers;
    const scope = content.querySelector('.pp-search-scope');
    if (scope) scope.hidden = !query;
    const empty = content.querySelector('.pp-no-results');
    if (empty) empty.hidden = count > 0 || visibleMembers > 0;
    const focus = content.querySelector('.pp-focus');
    if (focus) focus.hidden = !Array.from(content.querySelectorAll('.pp-check-row')).some(row => !row.hidden && row.dataset.category === 'combat');
    content.querySelectorAll('.pp-rank-legend').forEach(legend => { legend.hidden = !scales.has(legend.dataset.scale); });
  }
  async onAction(button, {reserved=false,reference=null}={}) {
    if (this.busy || this.referenceBusy && !reserved) return;
    this.busy = true;
    button.disabled = true;
    const actor=this.actor, token=this.token;
    let pendingTimer=null;
    const clickedCheck=getCharacter(actor)?.checks.find(check=>check.id===button.dataset.check);
    this.element.querySelectorAll('[name="actor"], [name="theme"]').forEach(field=>{field.disabled=true;});
    this.element.querySelectorAll('[name="focus"]').forEach(field => { field.disabled = true; });
    try {
      await this.focusSave;
      if (this.focusError && button.dataset.action === 'roll') throw this.focusError;
      if (button.dataset.action === 'refresh') await this.refreshCharacter();
      if (button.dataset.action === 'import') await this.importCharacter();
      if (button.dataset.action === 'animal-portrait') await this.importAnimalPortrait(button);
      if (['portrait','portrait-edit'].includes(button.dataset.action)) await this.importPortrait();
      if (button.dataset.action === 'administration') { this.administration=!this.administration;await this.render({force:true});if(this.administration&&this.preferences.animations!=='none')this.element.querySelector('.pp-administration')?.classList.add('pp-tools-opening'); }
      if (button.dataset.action === 'preferences') await this.preferencesDialog();
      if (button.dataset.action === 'presets') await this.presetsDialog();
      if (['battle','ring','full'].includes(button.dataset.action)) await this.setMode(button.dataset.action);
      if (button.dataset.action === 'preset') {
        const preset=this.preferences.presets.find(item=>item.id===button.dataset.preset);
        if (!preset || !actor?.isOwner) throw new Error('Bitte zuerst einen eigenen Charakter auswählen.');
        const sum=this.modifier+preset.modifier;
        if(!Number.isSafeInteger(sum))throw new Error('Bitte eine ganze Zahl für die Erschwernis oder Erleichterung eingeben.');
        const previous=this.modifier;
        this.modifier=sum;this.modifierDirection=this.modifier<0?-1:1;this.updateModifier();this.sound('dial');
        this.feedback('saved',`Vorlage angewendet: ${preset.label} · ${previous} ${preset.modifier<0?'−':'+'} ${Math.abs(preset.modifier)} = ${sum}`);
      }
      if (button.dataset.action === 'favorite') {
        const check=getCharacter(actor)?.checks.find(check=>check.id===button.dataset.check);
        resolveCheck(getCharacter(actor),checkReference(check));
        await this.persist(toggleFavorite(this.preferences,actor.id,check));
        await this.render({force:true});this.feedback('favorite','Favoriten gespeichert.');this.sound('favorite');
        const changed=Array.from(this.element.querySelectorAll('.pp-favorite-button')).find(field=>field.dataset.check===check.id);
        changed?.classList.add('pp-changed-value');setTimeout(()=>changed?.classList.remove('pp-changed-value'),320);
      }
      if (button.dataset.action === 'breakdown') await this.breakdownDialog(button.dataset.check);
      if (button.dataset.action === 'export') await this.exportBundle();
      if (button.dataset.action === 'diagnostic') await this.diagnosticDialog();
      if (button.dataset.action === 'roll') {
        this.element.querySelectorAll('[name="modifier"], [name="modifierDirection"], [name="focus"]').forEach(field => { field.disabled = true; });
        let check = reference ? resolveCheck(getCharacter(actor),reference) : getCharacter(actor)?.checks.find(check => check.id === button.dataset.check);
        if (!reference && (!check || !clickedCheck || referenceKey(checkReference(check))!==referenceKey(checkReference(clickedCheck)))) throw new Error('Die Probe wurde inzwischen geändert. Bitte erneut auswählen.');
        if(check.companionAbility||check.npcChoice){check=await this.configureCompanionAbility(actor,check);if(!check)return;}
        this.feedback('rollPending','');
        pendingTimer=setTimeout(()=>button.setAttribute?.('aria-busy','true'),180);
        await executeCheck(actor, check, token, { modifier: this.modifier, blind: button.dataset.blind === 'true' });
        this.modifier = 0;
        this.modifierDirection = 1;
        this.updateModifier();
        await this.persist(recordRecent(this.preferences,actor.id,clickedCheck??check));
        const recent=new Set((this.preferences.recent[actor.id] || []).flatMap(ref=>{try{return [resolveCheck(getCharacter(actor),ref).id];}catch{return [];}}));
        this.element.querySelectorAll('.pp-check-row').forEach(row=>{row.dataset.recent=String(recent.has(row.dataset.checkId));row.dataset.last=String(row.dataset.checkId===check.id);});
        this.feedback('modifierConsumed','');this.sound('roll');
      }
      if (button.dataset.action === 'token') await this.linkSelectedToken();
    } catch (error) {
      console.error(MODULE_ID, error);
      this.notify('error', error.message || 'Die Aktion konnte nicht ausgeführt werden.');
      this.feedback('rollError',error.message || 'Die Aktion konnte nicht ausgeführt werden.');this.sound('error');
    } finally {
      this.busy = false; button.disabled = false;
      clearTimeout(pendingTimer);button.removeAttribute?.('aria-busy');
      this.element.querySelectorAll('[name="actor"], [name="theme"]').forEach(field=>{field.disabled=false;});
      this.element.querySelectorAll('[data-action]').forEach(field=>{
        if (['battle','ring','full','administration','preferences','presets','favorite','breakdown'].includes(field.dataset.action)) field.disabled=false;
        if (field.dataset.action==='roll') { const status=connectionStatus(),check=getCharacter(this.actor)?.checks.find(check=>check.id===field.dataset.check);field.disabled=!this.actor?.isOwner || !status.ready || status.directReady===false || check?.kind==='combat' && status.combatReady===false; }
        if (field.dataset.action==='import') field.disabled=!(visibleActors().some(actor=>actor.canUserModify(game.user,'update')) || foundry.documents.Actor.canUserCreate(game.user));
        if (['portrait','portrait-edit'].includes(field.dataset.action)) field.disabled=!this.actor?.isOwner;
        if (field.dataset.action==='animal-portrait') field.disabled=!this.actor?.isOwner||!field.dataset.animalKey;
        if (field.dataset.action==='refresh') field.disabled=!this.actor?.isOwner||!getCharacter(this.actor)?.sourceJSON;
        if (field.dataset.action==='preset') field.disabled=!this.actor?.isOwner;
        if (field.dataset.action==='export') field.disabled=!this.actor?.isOwner || !getCharacter(this.actor)?.sourceJSON;
        if (field.dataset.action==='diagnostic') field.disabled=false;
      });
      this.element.querySelectorAll('[name="modifier"], [name="modifierDirection"]').forEach(field => { field.disabled = !this.actor?.isOwner; });
      this.element.querySelectorAll('[name="focus"]').forEach(field => { field.disabled = !this.actor?.isOwner; });
      this.element.querySelectorAll('[data-modifier-step]').forEach(field=>{field.disabled=!this.actor?.isOwner;});
      this.element.querySelectorAll('[data-armor]').forEach(field=>{field.disabled=!this.actor?.isOwner||!getCharacter(this.actor)?.sourceJSON||field.dataset.armorField==='equipped'&&field.dataset.armorLocked==='true';});
    }
  }
  async rollReference(actorId, reference, {blind=false,modifier}={}) {
    if (this.busy || this.referenceBusy) throw new Error('Bitte die laufende Aktion abwarten.');
    this.referenceBusy=true;
    try {
    const actor=game.actors.get(actorId);
    if (!actor?.isOwner) throw new Error('Zum Würfeln werden Besitzerrechte benötigt.');
    const check=resolveCheck(getCharacter(actor),reference);
    if (this.actorId!==actorId) this.selectActor(actorId);
    if (modifier!==undefined) {
      if (!Number.isSafeInteger(modifier)) throw new Error('Bitte eine ganze Zahl für die Erschwernis oder Erleichterung eingeben.');
      this.modifier=modifier;this.modifierDirection=modifier<0?-1:1;
    }
    await this.persist({...this.preferences,actorId});
    if (this.rendered) await this.render({force:true});
    if((check.kind==='combat'||isCompanionCheck(check)) && this.mode!=='battle')await this.setMode('battle');
    else if(check.kind!=='combat' && !isCompanionCheck(check) && this.mode==='battle')await this.setMode('full');
    await this.onAction({dataset:{action:'roll',check:check.id,blind:String(blind)},disabled:false},{reserved:true,reference});
    } finally { this.referenceBusy=false; }
  }
  async preferencesDialog() {
    const e=escapeHTML,t=text=>e(this.t(text)),draft=structuredClone(this.preferences);
    const select=(name,values)=>`<select name="${name}">${values.map(([value,label])=>`<option value="${value}" ${draft[name]===value?'selected':''}>${t(label)}</option>`).join('')}</select>`;
    const row=(label,control)=>`<label>${t(label)}${control}</label>`;
    const content=`<div class="pp-preferences">
      ${row('Darstellung der Liste',select('density',[['normal','Normal'],['compact','Kompakt'],['comfortable','Große Knöpfe']]))}
      ${row('Sprache',select('language',[['theme','Passend zum Design'],['standard','Normal'],['ork','Ork']]))}
      ${row('Animationen',select('animations',[['none','Aus'],['subtle','Dezent'],['full','Lebendig']]))}
      ${row('Soundeffekte',`<input name="sound" type="checkbox" ${draft.sound?'checked':''}>`)}
      ${row('Lautstärke',`<span><input name="volume" type="range" min="0" max="1" step="0.05" value="${draft.volume}"><output data-volume>${Math.round(draft.volume*100)}%</output></span>`)}
      ${row('Tokenrahmen',select('tokenFrame',tokenStyles()))}
      ${customFrameImportHTML()}<button type="button" data-token-refresh>${t('Token aktualisieren')}</button>
      ${game.user.isGM?`<label>${t('Originalrahmen importieren')}<input name="tokenFramesZip" type="file" accept=".zip"></label>`:''}<p data-frame-status role="status"></p>
      ${row('Klangset',select('soundSet',[['theme','Passend zum Design'],['fantasy','Fantasy'],['ork','Ork'],['dark','Neutral']]))}
      <button type="button" data-sound-preview>${t('Rastklang anhören')}</button><p data-sound-status role="status" hidden></p>
      ${row('Ausgewähltem Token folgen',`<input name="followToken" type="checkbox" ${draft.followToken?'checked':''}>`)}
      <p>${t('Ohne Tokenfolgen bleibt der gewählte Charakter angeheftet. Mehrere Tokens werden nicht automatisch zugeordnet.')}</p>
      <h3>${t('Favoriten ordnen')}</h3><div class="pp-favorite-editor"></div></div>`;
    const answer=await DialogV2.wait({window:{title:this.t('Einstellungen')},classes:this.dialogClasses,position:{width:470},modal:true,rejectClose:false,content,
      buttons:[{action:'save',label:this.t('Speichern'),callback:(_event,_button,dialog)=>{
        const root=dialog.element;
        return {...draft,density:root.querySelector('[name="density"]').value,language:root.querySelector('[name="language"]').value,
          tokenFrame:root.querySelector('[name="tokenFrame"]').value,animations:root.querySelector('[name="animations"]').value,sound:root.querySelector('[name="sound"]').checked,
          volume:Number(root.querySelector('[name="volume"]').value),soundSet:root.querySelector('[name="soundSet"]').value,
          followToken:root.querySelector('[name="followToken"]').checked};
      }},{action:'cancel',label:this.t('Abbrechen'),callback:()=>null}],
      render:(_event,dialog)=>{
        const frameStatus=dialog.element.querySelector('[data-frame-status]');
        dialog.element.querySelector('[name="customFrameFile"]').addEventListener('change',async event=>{
          const field=event.target;if(!field.files?.[0])return;field.disabled=true;const save=dialog.element.querySelector('[data-action="save"]'),refresh=dialog.element.querySelector('[data-token-refresh]');save.disabled=refresh.disabled=true;
          const status=dialog.element.querySelector('[data-custom-frame-status]');status.textContent=this.t('Rahmen wird gespeichert …');
          try{const frame=await importCustomFrame(field.files[0]);if(dialog.element.isConnected){fillFrameOptions(dialog.element.querySelector('[name="tokenFrame"]'),frame.id,frame);status.textContent=`${this.t('Rahmen gespeichert.')} ${frame.name}`;}}
          catch(error){if(dialog.element.isConnected)status.textContent=this.t(error.message);}
          finally{if(dialog.element.isConnected){field.disabled=false;save.disabled=refresh.disabled=false;}}
        });
        dialog.element.querySelector('[name="tokenFramesZip"]')?.addEventListener('change',async event=>{const field=event.target;field.disabled=true;try{await importTokenFrames(field.files?.[0]);frameStatus.textContent=this.t('Originalrahmen importiert.');}catch(error){frameStatus.textContent=this.t(error.message);}finally{field.disabled=false;}});
        dialog.element.querySelector('[data-token-refresh]').addEventListener('click',async event=>{const button=event.target;button.disabled=true;try{const actor=this.actor,style=dialog.element.querySelector('[name="tokenFrame"]').value,framed=await tokenFromActor(actor,style);await applyPortrait(actor,actor.img,message=>this.notify('warn',message),await uploadPortrait(framed.token),framingFor(framed));frameStatus.textContent=this.t('Tokenbild erstellt.');}catch(error){frameStatus.textContent=this.t(error.message);}finally{button.disabled=false;}});
        const host=dialog.element.querySelector('.pp-favorite-editor');
        const update=()=>{host.innerHTML=(draft.favorites[this.actorId] || []).map((ref,index)=>`<div><span>${e(checkDisplayName(ref,this.language))}${this.language==='ork' && ref.kind==='skill'?`<small class="pp-original-name">${e(ref.name)}</small>`:''}</span><button type="button" data-favorite-operation="up" data-index="${index}" aria-label="${t('Nach oben')}">↑</button><button type="button" data-favorite-operation="down" data-index="${index}" aria-label="${t('Nach unten')}">↓</button><button type="button" data-favorite-operation="remove" data-index="${index}" aria-label="${t('Entfernen')}">×</button></div>`).join('') || `<p>${t('Noch keine Favoriten.')}</p>`;};
        update();
        host.addEventListener('click',event=>{
          const button=event.target.closest('[data-favorite-operation]');if(!button)return;
          const refs=draft.favorites[this.actorId] || [],index=Number(button.dataset.index);if(!Number.isInteger(index)||!refs[index])return;
          if(button.dataset.favoriteOperation==='remove')draft.favorites[this.actorId]=refs.filter((_ref,i)=>i!==index);
          else draft.favorites=moveFavorite(draft,this.actorId,refs[index],button.dataset.favoriteOperation).favorites;
          update();
        });
        const volume=dialog.element.querySelector('[name="volume"]');
        volume.addEventListener('input',()=>{dialog.element.querySelector('[data-volume]').textContent=`${Math.round(Number(volume.value)*100)}%`;});
        dialog.element.querySelector('[data-sound-preview]').addEventListener('click',async()=>{
          const status=dialog.element.querySelector('[data-sound-status]');
          status.hidden=true;
          const amount=Number(volume.value);
          if(amount===0){status.textContent=this.t('Lautstärke ist 0. Zum Anhören erhöhen.');status.hidden=false;return;}
          const played=await playFeedback('preview',{sound:true,volume:amount,theme:this.theme,soundSet:dialog.element.querySelector('[name="soundSet"]').value});
          if(!played){status.textContent=this.t('Der Browser konnte den Klang nicht starten. Tonfreigabe und stummgeschalteten Tab prüfen.');status.hidden=false;}
        });
      }});
    if(!answer)return;
    await this.persist(answer);await this.render({force:true});this.feedback('saved','Einstellungen gespeichert.');
  }
  async presetsDialog() {
    const e=escapeHTML,t=text=>e(this.t(text));
    const lines=this.preferences.presets.map(item=>`${item.label} | ${item.modifier}`).join('\n');
    const answer=await DialogV2.wait({window:{title:this.t('Vorlagen')},classes:this.dialogClasses,modal:true,rejectClose:false,
      content:`<p>${t('Eine Vorlage pro Zeile: Name | Zahl. Positive Zahlen erschweren, negative erleichtern.')}</p><label>${t('Vorlagen')}<textarea name="presets" rows="6">${e(lines)}</textarea></label>`,
      buttons:[{action:'save',label:this.t('Speichern'),callback:(_ev,_bt,dialog)=>{
        const entries=dialog.element.querySelector('[name="presets"]').value.split('\n').map(line=>line.trim()).filter(Boolean);
        if(entries.length>24)throw new Error('Höchstens 24 Vorlagen verwenden.');
        return entries.map((line,index)=>{const match=line.match(/^(.{1,80}?)\s*\|\s*(-?\d+)$/);if(!match||!Number.isSafeInteger(Number(match[2])))throw new Error('Vorlage im Format Name | ganze Zahl eingeben.');return {id:`preset-${index}`,label:match[1].trim(),modifier:Number(match[2])};});
      }},{action:'cancel',label:this.t('Abbrechen'),callback:()=>null}]});
    if(answer===null)return;
    await this.persist({...this.preferences,presets:answer});await this.render({force:true});this.feedback('saved','Vorlagen gespeichert.');
  }
  async breakdownDialog(id) {
    const check=getCharacter(this.actor)?.checks.find(item=>item.id===id);
    if(!check)throw new Error('Die Probe wurde nicht gefunden.');
    const e=escapeHTML,t=text=>e(this.t(text));
    const c=check.combat;
    const body=c?`<p>${t('Fertigkeit')} ${c.skillValue} + ${t('Basis')} ${c.baseValue} + ${t('Fokus')} ${c.focusValue} + ${t('Waffenbonus')} ${c.weaponModifier} − BE ${c.mobilityPenalty} = <strong>${check.value}</strong></p>`
      : `<p>${(check.attributes || []).map(att=>`${e(att.name)} ${att.value}`).join(' · ')}</p><p>${t('Wert')}: <strong>${check.value}</strong></p>`;
    await DialogV2.wait({window:{title:checkDisplayName(check,this.language)},classes:this.dialogClasses,modal:true,rejectClose:false,content:(this.language==='ork' && check.kind==='skill'?`<p class="pp-original-name">${e(check.name)}</p>`:'')+body,buttons:[{action:'close',label:this.t('Schließen')}]});
  }
  async diagnosticDialog() {
    const data={foundry:game.version,module:game.modules.get(MODULE_ID)?.version,probes:game.modules.get('ucurifunke-checks')?.version,system:game.system.id,sourceVersion:getCharacter(this.actor)?.sourceVersion,connection:connectionStatus().message};
    await DialogV2.wait({window:{title:this.t('Versionsinformationen')},modal:true,rejectClose:false,
      content:`<textarea readonly rows="8" aria-label="${escapeHTML(this.t('Versionsinformationen'))}">${escapeHTML(JSON.stringify(data,null,2))}</textarea>`,buttons:[{action:'close',label:this.t('Schließen')}]});
  }
  async exportBundle() {
    const character=getCharacter(this.actor);
    if(!this.actor?.isOwner || !character?.sourceJSON)throw new Error('Für das Austauschpaket bitte die Originaldatei einmal erneut importieren.');
    const raw=JSON.parse(character.sourceJSON.replace(/^\uFEFF/,'')),focus=characterFocus(character);
    if(focus!==null){if(character.sourceFormat===NPC_FORMAT)raw.Npc.Focus=focus;else{raw.OffDefOffset=focus;raw.OffOffset=focus;raw.DefOffset=-focus;}}
    let portrait=null;
    const image=this.actor.img;
    if(image && /\.(png|jpe?g|bmp|webp)(?:[?#].*)?$/i.test(image)){
      const url=new URL(image,location.href);
      if(url.origin===location.origin){
        const response=await fetch(url);if(!response.ok)throw new Error('Das Charakterbild konnte für den Export nicht gelesen werden.');
        const bytes=await response.blob();if(bytes.size>10*1024*1024)throw new Error('Das Charakterbild ist zu groß für das Austauschpaket.');
        const extension=url.pathname.match(/\.([a-z]+)$/i)[1];portrait=new File([bytes],`portrait.${extension}`,{type:bytes.type});
      }
    }
    if(portrait&&character.sourceFormat!==NPC_FORMAT)raw.PortraitFileName=portrait.name;
    const blob=await writeCharacterBundle(JSON.stringify(raw,null,2),portrait),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=`${this.actor.name.replace(/[^\p{L}\p{N} _-]/gu,'').slice(0,70)||'Charakter'}.zip`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    this.feedback('saved','Austauschpaket gespeichert.');
  }
  async importCharacter() {
    const actors = visibleActors().filter(actor => actor.canUserModify(game.user, 'update')&&!actor.getFlag(MODULE_ID,'companion')?.sourceActorId);
    const canCreate = foundry.documents.Actor.canUserCreate(game.user);
    if (!actors.length && !canCreate) throw new Error('Für den Import benötigst du Besitzerrechte auf einem Foundry-Charakter.');
    let pending = null;
    let pendingSource=null;
    let portrait = null;
    let portraitManual = null;
    let portraitPackaged = null;
    let portraitBusy = false;
    let portraitError = false;
    let portraitSequence = 0;
    let readSequence = 0;
    let lastRead=null;
    let importKind=getCharacter(this.actor)?.sourceFormat===NPC_FORMAT?'npc':'character';
    this.importFolders??={};this.importSelections??={};
    const answer = await DialogV2.wait({
      window: { title: this.t('Charakter / NSC importieren') }, position: { width: 550 },
      classes: this.dialogClasses, content: renderImportOptions(actors, this.actorId, canCreate, this.preferences.tokenFrame,importKind), modal:true, rejectClose: false,
      buttons: [{ action: 'import', label:this.t('Importieren'), icon: 'fa-solid fa-file-import', disabled: true,
        callback: (_event, _button, dialog) => {
          if (!pending) { this.notify('warn', 'Bitte zuerst eine gültige Charakterdatei auswählen.'); return null; }
          const includeImages=dialog.element.querySelector('[name="includeImages"]').checked,includeCompanions=dialog.element.querySelector('[name="includeCompanions"]').checked,actorId=dialog.element.querySelector('[name="destination"]').value||null;
          const ownerId=dialog.element.querySelector('[name="ownerId"]')?.value||'';ownerAssignment(ownerId);
          const companionPlan=includeCompanions?prepareCompanionImport(pending,actorId,Array.from(dialog.element.querySelectorAll('[data-companion-import-index]')).map(field=>({index:Number(field.dataset.companionImportIndex),targetId:field.value}))):[];
          if (includeImages&&(portraitBusy || portraitError)) throw new Error('Bitte ein gültiges Bild auswählen oder die Bildauswahl leeren.');
          return { snapshot: pending, portrait:includeImages?portrait:null, includeImages,includeCompanions,companionPlan,ownerId,source:pendingSource,tokenFrame:dialog.element.querySelector('[name="tokenFrame"]').value, actorId: dialog.element.querySelector('[name="destination"]').value || null };
        } }, { action: 'cancel', label:this.t('Abbrechen'), callback: () => null }],
      render: (_event, dialog) => {
        localizeDialog(dialog.element,this.theme);
        const destination=dialog.element.querySelector('[name="destination"]');
        const syncButton = () => { dialog.element.querySelector('button[data-action="import"]').disabled = !pending || portraitBusy || portraitError || !destination.selectedOptions.length || destination.selectedOptions[0].disabled; };
        const images=dialog.element.querySelector('[name="includeImages"]'),companions=dialog.element.querySelector('[name="includeCompanions"]'),companionOptions=dialog.element.querySelector('[data-companion-import-options]');
        const renderCompanions=()=>{companionOptions.hidden=!companions.checked;companionOptions.innerHTML=pending?renderCompanionImportOptions(pending,destination.value||null):'';localizeDialog(companionOptions,this.theme);};
        destination.addEventListener('change',()=>{syncButton();renderCompanions();});companions.addEventListener('change',()=>{companionOptions.hidden=!companions.checked;});
        const imageInput = dialog.element.querySelector('[name="portraitFile"]');
        imageInput.addEventListener('change', async () => {
          if(!images.checked)return;
          const sequence = ++portraitSequence;
          portraitManual = null; portrait = portraitPackaged; portraitError = false; portraitBusy = true; syncButton();
          const preview = dialog.element.querySelector('.pp-portrait-preview');
          try {
            const file = imageInput.files?.[0];
            const prepared = file ? await preparePortrait(file) : null;
            if (sequence !== portraitSequence) return;
            portraitManual = prepared; portrait = portraitManual || portraitPackaged;
            preview.textContent = this.t(portrait ? `Bild ausgewählt: ${portrait.file.name}` : 'Kein Bild ausgewählt. Vorhandene Foundry-Bilder bleiben erhalten.');
          } catch (error) { if (sequence === portraitSequence) { portraitError = true; preview.textContent = this.t(error.message); } }
          finally { if (sequence === portraitSequence) { portraitBusy = false; syncButton(); } }
        });
        const folderContext=kind=>this.importFolders[kind]??this.importFolders[kind==='npc'?'character':'npc']??null;
        const resetSelection=(clearImage=false)=>{
          ++readSequence;pending=null;pendingSource=null;lastRead=null;companionOptions.innerHTML='';portraitPackaged=null;portrait=portraitManual;
          if(clearImage){++portraitSequence;portraitManual=null;portrait=null;portraitBusy=false;portraitError=false;imageInput.value='';}
          dialog.element.querySelector('.pp-portrait-preview').textContent=this.t(portrait?`Bild ausgewählt: ${portrait.file.name}`:'Kein Bild ausgewählt. Vorhandene Foundry-Bilder bleiben erhalten.');
          dialog.element.querySelector('.pp-portrait-source').textContent=this.t('Optional ein Charakterbild auswählen.');
          dialog.element.querySelector('.pp-import-preview').textContent=this.t('Bitte eine JSON-Datei auswählen.');syncButton();
          return readSequence;
        };
        const selectKind=kind=>{
          importKind=kind;
          dialog.element.querySelectorAll('[data-import-kind]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.importKind===kind)));
          dialog.element.querySelectorAll('[data-import-panel]').forEach(panel=>{panel.hidden=panel.dataset.importPanel!==kind;});
        };
        const readFile=async (file,source=null,live=null,{expectedKind=null,files=[]}={}) => {
          const sequence = ++readSequence,imageTicket=portraitSequence;
          pending = null;pendingSource=null;lastRead={file,source,files,expectedKind};
          portraitPackaged = null; portrait = portraitManual;
          dialog.element.querySelector('.pp-portrait-preview').textContent=this.t(portrait ? `Bild ausgewählt: ${portrait.file.name}` : 'Kein Bild ausgewählt. Vorhandene Foundry-Bilder bleiben erhalten.');
          const submit = dialog.element.querySelector('button[data-action="import"]');
          if (submit) submit.disabled = true;
          const preview = dialog.element.querySelector('.pp-import-preview');
          preview.textContent = this.t('Datei wird gelesen …');
          try {
            if (!file) throw new Error('Bitte eine JSON-Datei auswählen.');
            const imported=live??await readCharacterWithPortrait(file,files,{includePortrait:images.checked});
            const parsed = parseCharacter(imported.json);
            const actualKind=parsed.sourceFormat===NPC_FORMAT?'npc':'character';
            if(expectedKind&&actualKind!==expectedKind)throw new Error(expectedKind==='npc'?'Bitte eine gespeicherte NSC-Datei (.nsc.json) auswählen.':'Bitte eine Pedipalpus-Charakterdatei auswählen.');
            parsed.sourceJSON=imported.json;
            const packagedPortrait=images.checked&&imported.portrait?await preparePortrait(imported.portrait):null;
            if (sequence !== readSequence) return;
            selectKind(actualKind);
            portraitPackaged=images.checked&&imageTicket===portraitSequence?packagedPortrait:null;portrait=images.checked?(portraitManual || portraitPackaged):null;
            if(portrait && !portraitBusy && !portraitError)dialog.element.querySelector('.pp-portrait-preview').textContent=this.t(`Bild ausgewählt: ${portrait.file.name}`);
            pending = parsed;pendingSource=source??{fileName:file.name};lastRead={file,source,files,expectedKind};
            for(const option of destination.options){const target=getCharacter(game.actors.get(option.value));option.disabled=Boolean(target&&(target.sourceFormat??'character')!==(parsed.sourceFormat??'character'));}
            if(destination.selectedOptions[0]?.disabled){const compatible=Array.from(destination.options).find(option=>!option.disabled);if(compatible)destination.value=compatible.value;}
            renderCompanions();syncButton();
            preview.textContent = `${parsed.profile.name} · ${parsed.checks.filter(check => !check.reason).length} ${this.t('Proben')} · ${parsed.sourceFormat===NPC_FORMAT?'NSC · ':''}${this.t('Dateiversion')} ${parsed.sourceVersion}${parsed.warnings.length?' · '+parsed.warnings.join(' '):''}`;
            dialog.element.querySelector('.pp-portrait-source').textContent = parsed.profile.portraitFileName
              ? this.t(packagedPortrait?'Pedipalpus-Bild automatisch gefunden.':`Pedipalpus-Bild: CharacterPortraits/${parsed.profile.portraitFileName}. Den Pedipalpus-Ordner auswählen oder das Bild unten hinzufügen.`)
              : this.t('Optional ein Charakterbild auswählen.');
          } catch (error) { if (sequence === readSequence) preview.textContent = this.t(error.message); }
        };
        images.addEventListener('change',async()=>{
          const ticket=++portraitSequence,read=readSequence;portraitBusy=false;portraitError=false;portraitManual=null;portraitPackaged=null;portrait=null;imageInput.value='';
          dialog.element.querySelector('[data-image-options]').hidden=!images.checked;syncButton();
          if(!pending&&lastRead){const {file,source,files,expectedKind}=lastRead;await readFile(file,source,null,{files,expectedKind});return;}
          if(!images.checked||!pending||!lastRead)return;
          portraitBusy=true;syncButton();
          try{const {file,source,files}=lastRead,imported=source?.fileHandle?await readLiveSource(source):await readCharacterWithPortrait(file,files);
            if(ticket!==portraitSequence||read!==readSequence)return;
            if(imported.json!==pending.sourceJSON)throw new Error('Die Quelldatei wurde inzwischen geändert. Bitte erneut auswählen.');
            const prepared=imported.portrait?await preparePortrait(imported.portrait):null;
            if(ticket!==portraitSequence||read!==readSequence)return;portrait=portraitPackaged=prepared;
            dialog.element.querySelector('.pp-portrait-preview').textContent=this.t(portrait?`Bild ausgewählt: ${portrait.file.name}`:'Kein Bild ausgewählt. Vorhandene Foundry-Bilder bleiben erhalten.');
          }catch(error){if(ticket===portraitSequence&&read===readSequence){portraitError=true;dialog.element.querySelector('.pp-portrait-preview').textContent=this.t(error.message);}}
          finally{if(ticket===portraitSequence){portraitBusy=false;syncButton();}}
        });
        const entries=new Map();
        const fail=(error,ticket)=>{if(ticket===readSequence&&error.name!=='AbortError')dialog.element.querySelector('.pp-import-preview').textContent=this.t(error.message);};
        const readSelected=async kind=>{
          const entry=entries.get(kind),index=Number(entry.choice.value);
          if(entry.choice.value===''||!entry.items[index]||kind!==importKind)return;
          const ticket=resetSelection(),item=entry.items[index],context=folderContext(kind);
          this.importSelections[kind]=item.webkitRelativePath||item.name;
          try{
            let file=item,source=null,live=null;
            if(context?.handle){source={fileHandle:item,directoryHandle:context.handle,fileName:item.name};file=await item.getFile();live=await readLiveSource(source,{includePortrait:images.checked});}
            if(ticket!==readSequence||kind!==importKind)return;
            await readFile(file,source,live,{expectedKind:kind,files:context?.files??[]});
          }catch(error){fail(error,ticket);}
        };
        const loadFolder=async kind=>{
          const entry=entries.get(kind),context=folderContext(kind),ticket=readSequence;
          entry.items=[];entry.choice.innerHTML='';entry.choice.parentElement.hidden=true;entry.hint.textContent='';
          if(!context)return;
          try{
            const items=context.handle?await directoryCharacters(context.handle,kind):characterFiles(context.files,kind);
            if(ticket!==readSequence||kind!==importKind)return;
            entry.items=items;
            entry.hint.textContent=`${this.t('Gewählter Ordner')}: ${context.handle?.name||context.files?.[0]?.webkitRelativePath?.split('/')[0]||this.t('Ordner')}`;
            entry.choice.innerHTML=`<option value="">${this.t(kind==='npc'?'NSC auswählen …':'Charakter auswählen …')}</option>`+items.map((item,index)=>`<option value="${index}">${escapeHTML(item.name.replace(/(?:\.nsc)?\.json$/i,''))}</option>`).join('');
            entry.choice.parentElement.hidden=items.length===0;
            const selected=items.flatMap((item,index)=>(item.webkitRelativePath||item.name)===this.importSelections[kind]?[index]:[]);
            if(items.length===1||selected.length===1){entry.choice.value=String(selected.length===1?selected[0]:0);await readSelected(kind);}
            else dialog.element.querySelector('.pp-import-preview').textContent=this.t(items.length?(kind==='npc'?'Bitte einen NSC aus dem Ordner auswählen.':'Bitte einen Charakter aus dem Ordner auswählen.'):(kind==='npc'?'Hier wurden keine NSC-Dateien gefunden. Bitte den NSC-Ordner oder eine einzelne NSC-Datei auswählen.':'Im Ordner wurden keine Charakterdateien gefunden.'));
          }catch(error){fail(error,ticket);}
        };
        for(const kind of ['character','npc']){
          const npc=kind==='npc',entry={choice:dialog.element.querySelector(`[name="${npc?'folderNpc':'folderCharacter'}"]`),hint:dialog.element.querySelector(`[data-folder-source="${kind}"]`),items:[]};entries.set(kind,entry);
          const fileInput=dialog.element.querySelector(`[name="${npc?'npcFile':'characterFile'}"]`);
          fileInput.addEventListener('change',()=>{
            const ticket=resetSelection(),files=Array.from(fileInput.files??[]),selected=files.filter(file=>/\.(json|zip)$/i.test(file.name));
            if(selected.length!==1){dialog.element.querySelector('.pp-import-preview').textContent=this.t('Bitte genau einen Charakter auswählen.');return;}
            if(kind!==importKind)return;entry.choice.value='';
            readFile(selected[0],null,null,{expectedKind:npc?'npc':null,files:Array.from(new Set([...(folderContext(kind)?.files??[]),...files]))}).catch(error=>fail(error,ticket));
          });
          dialog.element.querySelector(npc?'[data-pick-npc]':'[data-pick-character]').addEventListener('click',async()=>{
            const ticket=resetSelection();entry.choice.value='';
            try{
              const [handle]=await globalThis.showOpenFilePicker({multiple:false,types:[{description:npc?'Pedipalpus-NSC':'Pedipalpus-Charakter',accept:{'application/json':['.json'],'application/zip':['.zip']}}]});
              if(ticket!==readSequence||kind!==importKind)return;
              const source={fileHandle:handle,directoryHandle:folderContext(kind)?.handle??null,fileName:handle.name},file=await handle.getFile(),live=await readLiveSource(source,{includePortrait:images.checked});
              if(ticket!==readSequence||kind!==importKind)return;
              await readFile(file,source,live,{expectedKind:npc?'npc':null});
            }catch(error){fail(error,ticket);}
          });
          dialog.element.querySelector(`[name="${npc?'npcFolder':'characterFolder'}"]`).addEventListener('change',event=>{
            resetSelection();this.importFolders[kind]={files:Array.from(event.target.files??[])};delete this.importSelections[kind];
            if(kind==='character'){this.characterFolderFiles=this.importFolders[kind].files;this.characterFolderHandle=null;}
            loadFolder(kind);
          });
          dialog.element.querySelector(npc?'[data-pick-npc-folder]':'[data-pick-folder]').addEventListener('click',async()=>{
            const ticket=resetSelection();
            try{const handle=await globalThis.showDirectoryPicker({mode:'read'});if(ticket!==readSequence||kind!==importKind)return;this.importFolders[kind]={handle};delete this.importSelections[kind];if(kind==='character'){this.characterFolderHandle=handle;this.characterFolderFiles=[];}await loadFolder(kind);}catch(error){fail(error,ticket);}
          });
          entry.choice.addEventListener('change',()=>{readSelected(kind);});
        }
        dialog.element.querySelectorAll('[data-import-kind]').forEach(button=>button.addEventListener('click',()=>{
          const kind=button.dataset.importKind;if(kind===importKind)return;resetSelection(true);selectKind(kind);loadFolder(kind);
        }));
        loadFolder(importKind);
      }
    });
    return this.acceptImport(answer);
  }
  async acceptImport(answer) {
    if (!answer?.snapshot) return;
    const importActor=game.actors.get(answer.actorId),previous=getCharacter(importActor),previousFraming=savedPortraitFraming(importActor),portraitExpected=importActor?JSON.stringify({img:importActor.img,framing:importActor.getFlag(MODULE_ID,'portraitFraming')}):undefined;
    const includeCompanions=answer.includeCompanions??true,includeImages=answer.includeImages??true;
    ownerAssignment(answer.ownerId);
    answer.snapshot=retainNpcChoices(previous,answer.snapshot);
    if(includeCompanions)answer.snapshot=retainCompanionChoices(previous,answer.snapshot);
    answer.snapshot=withCompanionImport(previous,answer.snapshot,includeCompanions);
    const plan=includeCompanions?(answer.companionPlan??prepareCompanionImport(answer.snapshot,answer.actorId,companionEntries(answer.snapshot).flatMap((_member,index)=>{try{const existing=companionActor(answer.actorId,companionKey(answer.snapshot,index));return existing?[{index,targetId:existing.id}]:[];}catch{return [];}}))):[];
    if(includeCompanions)verifyCompanionImport(answer.snapshot,answer.actorId,plan);
    if(!includeImages)answer.portrait=null;
    if(previous){
      const differences=compareCharacters(previous,answer.snapshot);
      if(differences.length){
        const e=escapeHTML,canKeepFocus=characterFocus(previous)!==null&&characterFocus(answer.snapshot)!==null;
        const accepted=await DialogV2.wait({window:{title:this.t('Import vergleichen')},classes:this.dialogClasses,position:{width:600},modal:true,rejectClose:false,
          content:`<p>${e(this.t('Diese Änderungen werden übernommen:'))}</p><div class="pp-import-diff"><table><thead><tr><th>${e(this.t('Probe'))}</th><th>${e(this.t('Bisher'))}</th><th>${e(this.t('Neu'))}</th></tr></thead><tbody>${differences.slice(0,200).map(row=>`<tr><td>${e(row.label)}${row.type==='ambiguous'?` · ${e(this.t('Mehrdeutig'))}`:''}</td><td>${e(row.before)}</td><td>${e(row.after)}</td></tr>`).join('')}</tbody></table>${differences.length>200?`<p>${differences.length-200} ${e(this.t('weitere Änderungen.'))}</p>`:''}</div>${canKeepFocus?`<label><input type="checkbox" name="keepFocus">${e(this.t('Aktuellen Foundry-Fokus behalten'))}</label>`:''}`,
          buttons:[{action:'accept',label:this.t('Übernehmen'),callback:(_ev,_button,dialog)=>({keepFocus:dialog.element.querySelector('[name="keepFocus"]')?.checked})},{action:'cancel',label:this.t('Abbrechen'),callback:()=>null}]});
        if(!accepted)return;
        if(accepted.keepFocus)answer.snapshot=withFocus(answer.snapshot,characterFocus(previous));
      }
    }
    if(answer.portrait)answer.portrait=await prepareTokenPortrait(answer.portrait,answer.tokenFrame,previousFraming??undefined);
    if(includeCompanions)verifyCompanionImport(answer.snapshot,answer.actorId,plan);
    const actor = await saveCharacter(answer.snapshot, answer.actorId, answer.portrait, message => this.notify('warn',message),JSON.stringify(previous),{ownerId:answer.ownerId,portraitExpected});
    if(includeCompanions)await applyCompanionImport(actor,plan,{includeImages,ownerId:answer.ownerId,tokenFrame:answer.tokenFrame,warn:message=>this.notify('warn',message)});
    this.selectActor(actor.id);
    await this.persist({...this.preferences,actorId:actor.id,category:'all'});
    await this.render({ force: true });
    this.notify('info', `${answer.snapshot.profile.name} wurde importiert.`);
    this.feedback('saved','Charakter importiert.');this.sound('import');
    if(answer.source)await rememberImportSource(actor.id,{...answer.source,tokenFrame:answer.tokenFrame,includeImages,includeCompanions});
    return actor;
  }
  async refreshCharacter() {
    const actor=this.actor;if(!actor?.isOwner)throw new Error('Zum Aktualisieren werden Besitzerrechte benötigt.');
    const source=await importSource(actor.id);if(!source?.fileHandle)return this.importCharacter();
    let imported;try{imported=await readLiveSource(source,{includePortrait:source.includeImages??true});}catch(error){this.notify('warn',this.t(error.message||'Die letzte Datei ist nicht zugänglich. Bitte die Quelle erneut auswählen.'));return this.importCharacter();}
    const snapshot=parseCharacter(imported.json);snapshot.sourceJSON=imported.json;
    return this.acceptImport({snapshot,includeImages:source.includeImages??true,includeCompanions:source.includeCompanions??getCharacter(actor)?.retinueImportEnabled??true,portrait:imported.portrait?await preparePortrait(imported.portrait):null,actorId:actor.id,tokenFrame:savedPortraitFraming(actor)?.style??source.tokenFrame??this.preferences.tokenFrame,source});
  }
  async configureCompanionAbility(actor,check){
    const character=getCharacter(actor),expected=JSON.stringify(character),root=Boolean(check.npcChoice);
    const member=root?{Name:character.profile.name}:companionEntries(character).find(member=>member._group===check.companionGroup&&member._index===check.companionIndex);
    if(!member)throw new Error('Dieses Gefolgsmitglied ist nicht mehr vorhanden.');
    const attrs=root?character.attributes:memberAttributes(member),e=escapeHTML,choice=check.companionAbility??{...check.npcChoice,name:check.name},keys=choice.keys??[],npcRules=root||check.npcRules;
    const answer=await DialogV2.wait({window:{title:this.t(root?'NSC-Probe':'Gefolgsprobe')},classes:this.dialogClasses,position:{width:460},modal:true,rejectClose:false,
      content:`<p>${e(member.Name)} · ${e(choice.name)} · PW ${e(check.value)}</p>${[0,1,2].map(index=>`<label>${index+1}. ${e(this.t('Attribut'))}<select name="companionAttribute${index}"><option value="">${e(this.t('Attribut auswählen …'))}</option>${attrs.map(attr=>`<option value="${attr.short}" ${keys[index]===attr.short?'selected':''}>${e(attr.name)} ${e(attr.value)}</option>`).join('')}</select></label>`).join('')}<label>${e(this.t('Probenname'))}<input name="companionCheckName" maxlength="100" value="${e(choice.name)}"></label>${npcRules?`<p>${e(this.t('Zwei gleiche Attribute sind erlaubt; alle drei dürfen nicht gleich sein.'))}</p>`:''}`,
      buttons:[{action:'companion-check',label:this.t('Würfeln'),disabled:keys.length!==3,callback:(_event,_button,dialog)=>({keys:[0,1,2].map(index=>dialog.element.querySelector(`[name="companionAttribute${index}"]`).value),name:dialog.element.querySelector('[name="companionCheckName"]').value})},{action:'cancel',label:this.t('Abbrechen'),callback:()=>null}],
      render:(_event,dialog)=>{
        localizeDialog(dialog.element,this.theme);
        const update=()=>{const values=Array.from(dialog.element.querySelectorAll('select')).map(field=>field.value);dialog.element.querySelector('[data-action="companion-check"]').disabled=values.some(value=>!value)||npcRules&&new Set(values).size<2;};
        dialog.element.querySelectorAll('select').forEach(field=>field.addEventListener('change',update));update();
      }});
    if(!answer)return null;
    if(!actor.isOwner||!actor.canUserModify(game.user,'update'))throw new Error('Zum Würfeln werden Besitzerrechte benötigt.');
    const fresh=getCharacter(actor),now=fresh?.checks.find(entry=>entry.id===check.id);
    if(JSON.stringify(fresh)!==expected||!now||referenceKey(checkReference(now))!==referenceKey(checkReference(check)))throw new Error('Die Probe wurde inzwischen geändert. Bitte erneut auswählen.');
    const label=answer.name.trim()||choice.name,name=root?label:`${member.Name} – ${label}`;
    if(/[|\r\n]/.test(name)||name.length>160)throw new Error('Der Probenname ist zu lang oder enthält ungültige Zeichen.');
    const updated=root?withNpcAttributes(fresh,check.id,answer.keys):withCompanionAttributes(fresh,check.id,answer.keys);
    if(!root||check.npcChoice.remember)await actor.setFlag(MODULE_ID,'character',updated);
    return {...updated.checks.find(entry=>entry.id===check.id),name};
  }
  async editPortrait(actor,{title='Charakterbild importieren',style=this.preferences.tokenFrame,action='image',label='Bild übernehmen'}={}){
    let editor;
    const saved=savedPortraitFraming(actor),initialStyle=saved?.style??style;
    try{return await DialogV2.wait({window:{title:this.t(title)},classes:this.dialogClasses,position:{width:450},modal:true,rejectClose:false,
      content:portraitEditorHTML(initialStyle,saved?.frame),buttons:[{action,label:this.t(label),disabled:true,callback:()=>editor.value()},{action:'cancel',label:this.t('Abbrechen'),callback:()=>false}],
      render:(_event,dialog)=>{
        localizeDialog(dialog.element,this.theme);
        editor=new PortraitEditor(dialog.element,{style:initialStyle,crop:saved??undefined,onState:({ready,message})=>{dialog.element.querySelector(`[data-action="${action}"]`).disabled=!ready;if(message)dialog.element.querySelector('.pp-portrait-preview').textContent=this.t(message);}});
        if(actor?.img&&!actor.img.endsWith('mystery-man.svg'))editor.load(()=>portraitFromActor(actor),saved??undefined);
        else editor.state(false,this.t('Bitte ein Bild auswählen.'));
      }});
    }finally{editor?.destroy();}
  }
  async importPortrait(){
    const actor=this.actor;if(!actor?.isOwner||!actor.canUserModify(game.user,'update'))throw new Error('Bitte einen eigenen Foundry-Charakter auswählen.');
    const expected=JSON.stringify({img:actor.img,framing:actor.getFlag(MODULE_ID,'portraitFraming')}),answer=await this.editPortrait(actor);
    if(!answer)return;
    const verify=()=>{if(!actor.isOwner||!actor.canUserModify(game.user,'update')||JSON.stringify({img:actor.img,framing:actor.getFlag(MODULE_ID,'portraitFraming')})!==expected)throw new Error('Das Charakterbild wurde inzwischen geändert. Bitte erneut öffnen.');};
    verify();const framed=await prepareTokenPortrait(answer.portrait,answer.style,answer.crop),image=await uploadPortrait(framed),token=await uploadPortrait(framed.token);verify();
    await applyPortrait(actor,image,message=>this.notify('warn',message),token,framingFor(framed));
    this.notify('info','Charakter- und Tokenbild übernommen.');
  }
  async importAnimalPortrait(button){
    const source=this.actor,index=Number(button.dataset.animal),character=getCharacter(source),key=companionKey(character,index);
    if(button.dataset.animalKey!==key)throw new Error('Das Gefolgsmitglied wurde inzwischen geändert. Bitte erneut auswählen.');
    const animal=companionEntries(character)[index],existing=source.getFlag(MODULE_ID,'companion')?.sourceActorId?source:companionActor(source.id,key),style=existing?.getFlag(MODULE_ID,'companion')?.tokenStyle||this.preferences.tokenFrame;
    const expected=JSON.stringify({img:existing?.img,framing:existing?.getFlag(MODULE_ID,'portraitFraming')}),expectedTarget={id:existing?.id,state:companionTargetState(existing),source:JSON.stringify(character)},answer=await this.editPortrait(existing,{title:`${animal.Name} · ${this.t('Bild / Token')}`,style,action:'animal-image',label:'Token erstellen'});
    if(!answer)return;
    if(JSON.stringify({img:existing?.img,framing:existing?.getFlag(MODULE_ID,'portraitFraming')})!==expected)throw new Error('Das Gefolgsbild wurde inzwischen geändert. Bitte erneut öffnen.');
    const framed=await prepareTokenPortrait(answer.portrait,answer.style,answer.crop);
    await saveCompanion(source,index,key,framed,message=>this.notify('warn',message),expectedTarget);
    this.notify('info',`${animal.Name}: ${this.t('Token erstellt. Aus dem Charakterverzeichnis auf die Karte ziehen.')}`);
  }
  async linkSelectedToken() {
    const selected = canvas.tokens?.controlled ?? [];
    if (selected.length !== 1) throw new Error('Bitte genau einen Token auf der Szene auswählen.');
    const token = selected[0].document;
    let accept = false;
    if (!token.actorLink && token.actorId && token.actorId === this.actorId) {
      accept = await DialogV2.confirm({ window: { title: this.t('Gemeinsames Charakterblatt verwenden') },
        ...(this.theme === 'ork' ? {classes:['pedipalpus-dialog','pp-ork-dialog'],yes:{label:this.t('Ja')},no:{label:this.t('Nein')}} : {}),
        content: `<p>${this.t('Dieser Token verwendet bisher ein eigenes Blatt. Nach dem Verknüpfen verwendet er die gemeinsamen Werte des gewählten Foundry-Charakters. Verknüpfen?')}</p>`, rejectClose: false });
      if (!accept) return;
    }
    await linkToken(this.actor, token, accept);
    await this.render({ force: true });
    this.notify('info', 'Der Token verwendet jetzt das gemeinsame Charakterblatt.');
  }
}
