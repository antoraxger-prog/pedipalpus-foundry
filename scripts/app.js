import { MAX_FILE_SIZE, parseCharacter, MODULE_ID } from './data.js';
import { connectionStatus, executeCheck } from './commands.js';
import { getCharacter, visibleActors, saveCharacter, saveChanges, linkToken } from './storage.js';
import { applyCharacterChanges, characterRevision, characterField } from './editing.js';
import { renderView, renderImportOptions, renderProbe } from './view.js';

const { ApplicationV2, DialogV2 } = foundry.applications.api;
export class PedipalpusApp extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    classes: ['pedipalpus-app'], tag: 'section',
    window: { title: 'Pedipalpus – Charaktere', icon: 'fa-solid fa-dice-d20', resizable: true },
    position: { width: 1280, height: 820 }
  };
  constructor(options = {}) {
    super(options);
    this.actorId = null;
    this.search = '';
    this.currentTab = 'mundane';
    this.category = 'BodySkills';
    this.subTabs = { mundane: 'general', magic: 'spells', clerical: 'miracles', inventory: 'everyday' };
    this.theme = game.settings.get(MODULE_ID, 'theme') || 'dark';
    this.busy = false;
    this.draft = null;
    this.changes = [];
    this.editRevision = null;
    this.inputDirty = false;
  }
  get actor() { return this.actorId ? game.actors.get(this.actorId) : null; }
  get token() {
    return canvas.tokens?.controlled?.map(placeable => placeable.document)
      .find(token => token.actorId === this.actorId && token.actorLink) ?? null;
  }
  async open(actorId = null) {
    if (actorId && actorId !== this.actorId) {
      if (!await this.confirmDiscard()) return this;
      this.clearDraft();
      this.actorId = actorId;
    }
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
      actor, character: this.draft || getCharacter(actor), status: connectionStatus(),
      canImport: actors.some(actor => actor.canUserModify(game.user, 'update')) || foundry.documents.Actor.canUserCreate(game.user),
      token: this.token, search: this.search, tab: this.currentTab, category: this.category, subTabs: this.subTabs, theme: this.theme });
  }
  _replaceHTML(result, content) {
    content.innerHTML = result;
    content.querySelector('[name="actor"]').addEventListener('change', async event => {
      if (!await this.confirmDiscard()) { event.target.value = this.actorId || ''; return; }
      this.clearDraft();
      this.actorId = event.target.value || null;
      this.search = '';
      await this.render({ force: true });
    });
    content.querySelector('[name="search"]')?.addEventListener('input', event => {
      this.search = event.target.value;
      this.filterChecks(content);
    });
    content.querySelector('[name="theme"]').addEventListener('change', event => {
      this.theme = event.target.value === 'light' ? 'light' : 'dark';
      content.querySelector('.pp-root').dataset.theme = this.theme;
      game.settings.set(MODULE_ID, 'theme', this.theme).catch(error => console.error(MODULE_ID, error));
    });
    content.querySelectorAll('[name="category"]').forEach(radio => radio.addEventListener('change', event => {
      this.category = event.target.value;
      this.search = '';
      content.querySelector('[name="search"]').value = '';
      this.filterChecks(content);
    }));
    content.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => this.onAction(button)));
    content.querySelectorAll('[data-edit]').forEach(input => {
      input.addEventListener('input', () => {
        this.changeField(input, content, false);
      });
      input.addEventListener('change', () => this.changeField(input, content));
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter' && input.tagName !== 'TEXTAREA') {
          event.preventDefault(); input.blur();
          this.saveDraft().catch(error => ui.notifications.error(error.message));
        }
      });
    });
    this.refreshFields(content);
    this.filterChecks(content);
  }
  clearDraft() { this.draft = null; this.changes = []; this.editRevision = null; this.inputDirty = false; }
  async confirmDiscard() {
    if (!this.changes.length && !this.inputDirty) return true;
    return DialogV2.confirm({ window: { title: 'Ungespeicherte Änderungen' }, content: '<p>Die Änderungen wurden noch nicht gespeichert. Änderungen verwerfen?</p>', rejectClose: false });
  }
  async close(options = {}) {
    if (!await this.confirmDiscard()) return this;
    this.clearDraft();
    return super.close(options);
  }
  changeField(input, content, reportError = true) {
    this.inputDirty = false;
    try {
      if (!this.actor?.isOwner) throw new Error('Du benötigst Besitzerrechte zum Bearbeiten.');
      const snapshot = this.draft || getCharacter(this.actor);
      if (!snapshot) throw new Error('Bitte zuerst einen Charakter importieren.');
      const value = input.type === 'checkbox' ? input.checked : input.type === 'number' ? (input.value.trim() ? Number(input.value) : NaN) : input.value;
      if (Object.is(characterField(snapshot, input.dataset.edit), value)) { this.refreshFields(content); return; }
      const change = { path: input.dataset.edit, value };
      const next = applyCharacterChanges(snapshot, [change]);
      if (!this.changes.length) this.editRevision = characterRevision(getCharacter(this.actor));
      this.draft = next;
      this.changes.push(change);
    } catch (error) {
      if (reportError) ui.notifications.error(error.message);
      else this.inputDirty = true;
    }
    this.refreshFields(content);
  }
  refreshFields(content = this.element) {
    const character = this.draft || getCharacter(this.actor);
    if (!character) return;
    content.querySelectorAll('[data-edit], [data-display]').forEach(element => {
      const path = element.dataset.edit || element.dataset.display;
      let value;
      try { value = characterField(character, path); } catch { return; }
      if (element.dataset.display) element.textContent = typeof value === 'number' ? value.toLocaleString('de-DE', { maximumFractionDigits: 2 }) : '–';
      else if (element.type === 'checkbox') element.checked = value === true;
      else if (document.activeElement !== element) element.value = value ?? '';
    });
    content.querySelectorAll('[data-probe]').forEach(element => {
      const check = character.checks.find(check => check.id === element.dataset.probe);
      if (check) element.innerHTML = renderProbe(check.attributes);
    });
    const status = content.querySelector('.pp-save-status');
    if (status) status.textContent = this.inputDirty ? 'Eingabe noch unvollständig.' : this.changes.length ? 'Ungespeicherte Änderungen.' : 'Gespeichert.';
    content.querySelector('[data-action="save"]')?.toggleAttribute('disabled', !this.changes.length && !this.inputDirty);
    content.querySelector('[data-action="discard"]')?.toggleAttribute('disabled', !this.changes.length && !this.inputDirty);
  }
  async saveDraft() {
    if (this.inputDirty && this.element.contains(document.activeElement)) document.activeElement.blur();
    if (this.inputDirty) throw new Error('Bitte die unvollständige Eingabe zuerst korrigieren.');
    if (!this.changes.length) return;
    await saveChanges(this.actor, this.changes, this.editRevision);
    this.clearDraft();
    await this.render({ force: true });
    ui.notifications.info('Die Charakteränderungen wurden gespeichert.');
  }
  filterChecks(content = this.element) {
    const query = this.search.trim().toLocaleLowerCase('de');
    let count = 0;
    content.querySelectorAll('.pp-check-group').forEach(group => {
      group.querySelectorAll('.pp-check-row').forEach(row => {
        row.hidden = query ? !row.dataset.search.includes(query) : group.dataset.category !== this.category;
        if (!row.hidden) count++;
      });
      group.hidden = !group.querySelector('.pp-check-row:not([hidden])');
    });
    const scope = content.querySelector('.pp-search-scope');
    if (scope) scope.hidden = !query;
    const empty = content.querySelector('.pp-no-results');
    if (empty) empty.hidden = count > 0;
  }
  async onAction(button) {
    if (button.dataset.action === 'subtab') {
      const owner = button.dataset.owner;
      this.subTabs[owner] = button.dataset.subtab;
      this.element.querySelectorAll(`[data-subpanel][data-owner="${owner}"]`).forEach(panel => { panel.hidden = panel.dataset.subpanel !== this.subTabs[owner]; });
      this.element.querySelectorAll(`[data-subtab][data-owner="${owner}"]`).forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.subtab === this.subTabs[owner])));
      return;
    }
    if (button.dataset.action === 'tab') {
      this.currentTab = button.dataset.tab;
      this.element.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== this.currentTab; });
      this.element.querySelectorAll('[data-tab]').forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.tab === this.currentTab)));
      return;
    }
    if (this.busy) return;
    this.busy = true;
    button.disabled = true;
    try {
      if (button.dataset.action === 'import') await this.importCharacter();
      if (button.dataset.action === 'save') await this.saveDraft();
      if (button.dataset.action === 'discard') { this.clearDraft(); await this.render({ force: true }); }
      if (button.dataset.action === 'roll') {
        await this.saveDraft();
        const check = getCharacter(this.actor)?.checks.find(check => check.id === button.dataset.check);
        await executeCheck(this.actor, check, this.token);
      }
      if (button.dataset.action === 'token') await this.linkSelectedToken();
    } catch (error) {
      console.error('pedipalpus-foundry', error);
      ui.notifications.error(error.message || 'Die Aktion konnte nicht ausgeführt werden.');
    } finally { this.busy = false; button.disabled = false; }
  }
  async importCharacter() {
    if (!await this.confirmDiscard()) return;
    if (this.changes.length || this.inputDirty) { this.clearDraft(); await this.render({ force: true }); }
    const actors = visibleActors().filter(actor => actor.canUserModify(game.user, 'update'));
    const canCreate = foundry.documents.Actor.canUserCreate(game.user);
    if (!actors.length && !canCreate) throw new Error('Für den Import benötigst du Besitzerrechte auf einem Foundry-Charakter.');
    let pending = null;
    let readSequence = 0;
    const answer = await DialogV2.wait({
      window: { title: 'Pedipalpus-Charakter importieren' }, position: { width: 550 },
      classes: ['pedipalpus-dialog'], content: renderImportOptions(actors, this.actorId, canCreate), rejectClose: false,
      buttons: [{ action: 'import', label: 'Importieren', icon: 'fa-solid fa-file-import', disabled: true,
        callback: (_event, _button, dialog) => {
          if (!pending) { ui.notifications.warn('Bitte zuerst eine gültige Charakterdatei auswählen.'); return null; }
          return { snapshot: pending, actorId: dialog.element.querySelector('[name="destination"]').value || null };
        } }, { action: 'cancel', label: 'Abbrechen', callback: () => null }],
      render: (_event, dialog) => {
        const input = dialog.element.querySelector('[name="characterFile"]');
        input.addEventListener('change', async () => {
          const sequence = ++readSequence;
          pending = null;
          const submit = dialog.element.querySelector('button[data-action="import"]');
          if (submit) submit.disabled = true;
          const preview = dialog.element.querySelector('.pp-import-preview');
          preview.textContent = 'Datei wird gelesen …';
          try {
            const file = input.files?.[0];
            if (!file) throw new Error('Bitte eine JSON-Datei auswählen.');
            if (file.size > MAX_FILE_SIZE) throw new Error('Die Datei ist größer als 5 MB.');
            const parsed = parseCharacter(await file.text());
            if (sequence !== readSequence) return;
            pending = parsed;
            if (submit) submit.disabled = false;
            preview.textContent = `${parsed.profile.name} · ${parsed.checks.filter(check => !check.reason).length} Proben · Dateiversion ${parsed.sourceVersion}`;
          } catch (error) { if (sequence === readSequence) preview.textContent = error.message; }
        });
      }
    });
    if (!answer?.snapshot) return;
    const actor = await saveCharacter(answer.snapshot, answer.actorId);
    this.actorId = actor.id;
    this.search = '';
    await this.render({ force: true });
    ui.notifications.info(`${answer.snapshot.profile.name} wurde importiert.`);
  }
  async linkSelectedToken() {
    const selected = canvas.tokens?.controlled ?? [];
    if (selected.length !== 1) throw new Error('Bitte genau einen Token auf der Szene auswählen.');
    const token = selected[0].document;
    let accept = false;
    if (!token.actorLink && token.actorId && token.actorId === this.actorId) {
      accept = await DialogV2.confirm({ window: { title: 'Gemeinsames Charakterblatt verwenden' },
        content: '<p>Dieser Token verwendet bisher ein eigenes Blatt. Nach dem Verknüpfen verwendet er die gemeinsamen Werte des gewählten Foundry-Charakters. Verknüpfen?</p>', rejectClose: false });
      if (!accept) return;
    }
    await linkToken(this.actor, token, accept);
    await this.render({ force: true });
    ui.notifications.info('Der Token verwendet jetzt das gemeinsame Charakterblatt.');
  }
}
