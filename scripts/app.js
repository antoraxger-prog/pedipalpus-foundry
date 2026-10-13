import { MAX_FILE_SIZE, parseCharacter, MODULE_ID } from './data.js';
import { connectionStatus, executeCheck } from './commands.js';
import { getCharacter, visibleActors, saveCharacter, linkToken, saveFocus } from './storage.js';
import { renderView, renderImportOptions, updateFocusView } from './view.js';
import { withFocus } from './combat.js';
import { preparePortrait, uploadPortrait, applyPortrait } from './portraits.js';
import { savedDesign, initializeDesign, saveDesign, THEMES } from './design.js';
import { uiText, localizeSurface, localizeDialog } from './language.js';

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
    this.modifier = 0;
    this.modifierDirection = 1;
    this.focusSave = Promise.resolve();
    this.focusError = null;
  }
  get actor() { return this.actorId ? game.actors.get(this.actorId) : null; }
  get token() {
    return canvas.tokens?.controlled?.map(placeable => placeable.document)
      .find(token => token.actorId === this.actorId && token.actorLink) ?? null;
  }
  async open(actorId = null) {
    await this.designSave;
    try { await initializeDesign(); } catch (error) { console.error(MODULE_ID,error); this.notify('warn','Das Design konnte nicht gespeichert werden.'); }
    this.theme = savedDesign();
    if (actorId && actorId !== this.actorId) { this.actorId = actorId; this.search = ''; this.category = 'all'; this.focusError = null; }
    else if (!this.actorId) {
      const controlled = canvas.tokens?.controlled?.[0]?.document;
      const actor = controlled?.actorLink && game.actors.get(controlled.actorId);
      this.actorId = actor && getCharacter(actor) ? actor.id
        : visibleActors().find(actor => actor.isOwner && getCharacter(actor))?.id ?? null;
    }
    await this.render({ force: true });
    this.bringToFront();
    return this;
  }
  async _renderHTML() {
    const actors = visibleActors();
    const actor = actors.find(actor => actor.id === this.actorId) ?? null;
    if (!actor) this.actorId = null;
    return renderView({ actors: actors.map(item => ({ id: item.id, name: item.name, hasCharacter: !!getCharacter(item) })),
      actor, character: getCharacter(actor), status: connectionStatus(),
      canImport: actors.some(actor => actor.canUserModify(game.user, 'update')) || foundry.documents.Actor.canUserCreate(game.user),
      token: this.token, canLinkToken: actor?.isOwner && !this.token && canvas.tokens?.controlled?.length === 1,
      search: this.search, category: this.category, theme: this.theme, modifier: this.modifier, modifierDirection: this.modifierDirection, busy: this.busy });
  }
  _replaceHTML(result, content) {
    this.element.dataset.ppTheme = this.theme;
    content.innerHTML = result;
    const title = this.element.querySelector('.window-title');
    if (title) title.textContent = 'Pedipalpus – Proben';
    localizeSurface(this.element, this.theme, getCharacter(this.actor), this.actor, this.token);
    content.querySelector('[name="actor"]').addEventListener('change', async event => {
      this.actorId = event.target.value || null;
      this.search = '';
      this.category = 'all';
      this.focusError = null;
      await this.render({ force: true });
    });
    content.querySelector('[name="search"]')?.addEventListener('input', event => {
      this.search = event.target.value;
      this.filterChecks(content);
    });
    content.querySelector('[name="theme"]').addEventListener('change', event => {
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
    });
    content.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => this.onAction(button)));
    const focus = content.querySelector('[name="focus"]');
    focus?.addEventListener('input', () => {
      updateFocusView(content, withFocus(getCharacter(this.actor), Number(focus.value)));
    });
    focus?.addEventListener('change', () => {
      const actor = this.actor;
      const value = Number(focus.value);
      this.focusSave = this.focusSave.then(() => saveFocus(actor, value)).then(() => {
        if (this.actorId === actor.id) this.focusError = null;
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
    });
    modifier?.addEventListener('wheel', event => {
      if (!event.deltaY || modifier.disabled) return;
      event.preventDefault();
      const value = this.modifier;
      this.modifier = (Number.isSafeInteger(value) ? value : 0) + (event.deltaY < 0 ? 1 : -1);
      this.updateModifier(content);
    }, { passive: false });
    content.querySelector('[name="modifierDirection"]')?.addEventListener('click', () => {
      this.modifierDirection *= -1;
      this.modifier = Math.abs(this.modifier) * this.modifierDirection;
      this.updateModifier(content);
    });
    this.filterChecks(content);
  }
  t(text) { return uiText(this.theme,text); }
  notify(level, text) { ui.notifications[level](this.t(text)); }
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
    let count = 0;
    const scales = new Set();
    content.querySelectorAll('.pp-check-row').forEach(row => {
      row.hidden = query ? !row.dataset.search.includes(query) : this.category !== 'all' && row.dataset.category !== this.category;
      if (!row.hidden) { count++; scales.add(row.dataset.scale); }
    });
    const scope = content.querySelector('.pp-search-scope');
    if (scope) scope.hidden = !query;
    const empty = content.querySelector('.pp-no-results');
    if (empty) empty.hidden = count > 0;
    const focus = content.querySelector('.pp-focus');
    if (focus) focus.hidden = !Array.from(content.querySelectorAll('.pp-check-row')).some(row => !row.hidden && row.dataset.category === 'combat');
    content.querySelectorAll('.pp-rank-legend').forEach(legend => { legend.hidden = !scales.has(legend.dataset.scale); });
  }
  async onAction(button) {
    if (this.busy) return;
    this.busy = true;
    button.disabled = true;
    if (button.dataset.action === 'roll') this.element.querySelectorAll('[name="focus"]').forEach(field => { field.disabled = true; });
    try {
      await this.focusSave;
      if (this.focusError && button.dataset.action === 'roll') throw this.focusError;
      if (button.dataset.action === 'import') await this.importCharacter();
      if (button.dataset.action === 'portrait') await this.importPortrait();
      if (button.dataset.action === 'roll') {
        this.element.querySelectorAll('[name="modifier"], [name="modifierDirection"], [name="focus"]').forEach(field => { field.disabled = true; });
        const check = getCharacter(this.actor)?.checks.find(check => check.id === button.dataset.check);
        await executeCheck(this.actor, check, this.token, { modifier: this.modifier, blind: button.dataset.blind === 'true' });
        this.modifier = 0;
        this.modifierDirection = 1;
        this.updateModifier();
      }
      if (button.dataset.action === 'token') await this.linkSelectedToken();
    } catch (error) {
      console.error(MODULE_ID, error);
      this.notify('error', error.message || 'Die Aktion konnte nicht ausgeführt werden.');
    } finally {
      this.busy = false; button.disabled = false;
      this.element.querySelectorAll('[name="modifier"], [name="modifierDirection"]').forEach(field => { field.disabled = false; });
      this.element.querySelectorAll('[name="focus"]').forEach(field => { field.disabled = !this.actor?.isOwner; });
    }
  }
  async importCharacter() {
    const actors = visibleActors().filter(actor => actor.canUserModify(game.user, 'update'));
    const canCreate = foundry.documents.Actor.canUserCreate(game.user);
    if (!actors.length && !canCreate) throw new Error('Für den Import benötigst du Besitzerrechte auf einem Foundry-Charakter.');
    let pending = null;
    let portrait = null;
    let portraitBusy = false;
    let portraitError = false;
    let portraitSequence = 0;
    let readSequence = 0;
    const answer = await DialogV2.wait({
      window: { title: this.t('Pedipalpus-Charakter importieren') }, position: { width: 550 },
      classes: ['pedipalpus-dialog', ...(this.theme === 'ork' ? ['pp-ork-dialog'] : [])], content: renderImportOptions(actors, this.actorId, canCreate), rejectClose: false,
      buttons: [{ action: 'import', label:this.t('Importieren'), icon: 'fa-solid fa-file-import', disabled: true,
        callback: (_event, _button, dialog) => {
          if (!pending) { this.notify('warn', 'Bitte zuerst eine gültige Charakterdatei auswählen.'); return null; }
          if (portraitBusy || portraitError) throw new Error('Bitte ein gültiges Bild auswählen oder die Bildauswahl leeren.');
          return { snapshot: pending, portrait, actorId: dialog.element.querySelector('[name="destination"]').value || null };
        } }, { action: 'cancel', label:this.t('Abbrechen'), callback: () => null }],
      render: (_event, dialog) => {
        localizeDialog(dialog.element,this.theme);
        const input = dialog.element.querySelector('[name="characterFile"]');
        const syncButton = () => { dialog.element.querySelector('button[data-action="import"]').disabled = !pending || portraitBusy || portraitError; };
        const imageInput = dialog.element.querySelector('[name="portraitFile"]');
        imageInput.addEventListener('change', async () => {
          const sequence = ++portraitSequence;
          portrait = null; portraitError = false; portraitBusy = true; syncButton();
          const preview = dialog.element.querySelector('.pp-portrait-preview');
          try {
            const file = imageInput.files?.[0];
            const prepared = file ? await preparePortrait(file) : null;
            if (sequence !== portraitSequence) return;
            portrait = prepared;
            preview.textContent = this.t(file ? `Bild ausgewählt: ${file.name}` : 'Kein Bild ausgewählt. Vorhandene Foundry-Bilder bleiben erhalten.');
          } catch (error) { if (sequence === portraitSequence) { portraitError = true; preview.textContent = this.t(error.message); } }
          finally { if (sequence === portraitSequence) { portraitBusy = false; syncButton(); } }
        });
        input.addEventListener('change', async () => {
          const sequence = ++readSequence;
          pending = null;
          const submit = dialog.element.querySelector('button[data-action="import"]');
          if (submit) submit.disabled = true;
          const preview = dialog.element.querySelector('.pp-import-preview');
          preview.textContent = this.t('Datei wird gelesen …');
          try {
            const file = input.files?.[0];
            if (!file) throw new Error('Bitte eine JSON-Datei auswählen.');
            if (file.size > MAX_FILE_SIZE) throw new Error('Die Datei ist größer als 5 MB.');
            const parsed = parseCharacter(await file.text());
            if (sequence !== readSequence) return;
            pending = parsed;
            syncButton();
            preview.textContent = `${parsed.profile.name} · ${parsed.checks.filter(check => !check.reason).length} ${this.t('Proben')} · ${this.t('Dateiversion')} ${parsed.sourceVersion}`;
            dialog.element.querySelector('.pp-portrait-source').textContent = parsed.profile.portraitFileName
              ? this.t(`Pedipalpus-Bild: CharacterPortraits/${parsed.profile.portraitFileName}. Diese separate Bilddatei unten auswählen.`)
              : this.t('Optional ein Charakterbild auswählen.');
          } catch (error) { if (sequence === readSequence) preview.textContent = this.t(error.message); }
        });
      }
    });
    if (!answer?.snapshot) return;
    const actor = await saveCharacter(answer.snapshot, answer.actorId, answer.portrait, message => this.notify('warn',message));
    this.actorId = actor.id;
    this.search = '';
    this.category = 'all';
    this.focusError = null;
    await this.render({ force: true });
    this.notify('info', `${answer.snapshot.profile.name} wurde importiert.`);
  }
  async importPortrait() {
    const actor = this.actor;
    if (!actor?.canUserModify(game.user,'update')) throw new Error('Bitte einen eigenen Foundry-Charakter auswählen.');
    let portrait = null;
    let sequence = 0;
    const answer = await DialogV2.wait({window:{title:this.t('Charakterbild importieren')},classes:['pedipalpus-dialog',...(this.theme === 'ork' ? ['pp-ork-dialog'] : [])],position:{width:450},rejectClose:false,
      content:'<label>Bilddatei<input name="portraitFile" type="file" accept=".png,.jpg,.jpeg,.bmp,.webp"></label><p class="pp-portrait-preview">Bild bis 10 MB auswählen. Das Bild wird für Charakter, Token-Vorlage und bearbeitbare verknüpfte Tokens übernommen.</p>',
      buttons:[{action:'image',label:this.t('Bild übernehmen'),disabled:true,callback:() => portrait},{action:'cancel',label:this.t('Abbrechen'),callback:() => null}],
      render:(_event,dialog) => {
        localizeDialog(dialog.element,this.theme);
        dialog.element.querySelector('[name="portraitFile"]').addEventListener('change',async event => {
          const read = ++sequence;
          portrait = null;
          const submit = dialog.element.querySelector('[data-action="image"]'); submit.disabled = true;
          try {
            const image = await preparePortrait(event.target.files?.[0]);
            if (read !== sequence) return;
            portrait = image; submit.disabled = false;
            dialog.element.querySelector('.pp-portrait-preview').textContent = this.t(`Bild ausgewählt: ${event.target.files[0].name}`);
          } catch(error) { if (read === sequence) dialog.element.querySelector('.pp-portrait-preview').textContent = this.t(error.message); }
        });
      }});
    if (!answer) return;
    await applyPortrait(actor,await uploadPortrait(answer),message => this.notify('warn',message));
    this.notify('info', 'Charakter- und Tokenbild übernommen.');
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
