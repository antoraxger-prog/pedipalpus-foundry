import { MAX_FILE_SIZE, parseCharacter, MODULE_ID } from './data.js';
import { connectionStatus, executeCheck } from './commands.js';
import { getCharacter, visibleActors, saveCharacter, linkToken } from './storage.js';
import { renderView, renderImportOptions } from './view.js';

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
    this.theme = game.settings.get(MODULE_ID, 'theme') || 'fantasy';
    this.busy = false;
    this.modifier = 0;
    this.modifierDirection = 1;
  }
  get actor() { return this.actorId ? game.actors.get(this.actorId) : null; }
  get token() {
    return canvas.tokens?.controlled?.map(placeable => placeable.document)
      .find(token => token.actorId === this.actorId && token.actorLink) ?? null;
  }
  async open(actorId = null) {
    if (actorId && actorId !== this.actorId) { this.actorId = actorId; this.search = ''; this.category = 'all'; }
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
      search: this.search, category: this.category, theme: this.theme, modifier: this.modifier, modifierDirection: this.modifierDirection });
  }
  _replaceHTML(result, content) {
    this.element.dataset.ppTheme = this.theme;
    content.innerHTML = result;
    content.querySelector('[name="actor"]').addEventListener('change', async event => {
      this.actorId = event.target.value || null;
      this.search = '';
      this.category = 'all';
      await this.render({ force: true });
    });
    content.querySelector('[name="search"]')?.addEventListener('input', event => {
      this.search = event.target.value;
      this.filterChecks(content);
    });
    content.querySelector('[name="theme"]').addEventListener('change', event => {
      this.theme = ['fantasy', 'light', 'dark'].includes(event.target.value) ? event.target.value : 'fantasy';
      this.element.dataset.ppTheme = this.theme;
      content.querySelector('.pp-root').dataset.theme = this.theme;
      game.settings.set(MODULE_ID, 'theme', this.theme).catch(error => console.error(MODULE_ID, error));
    });
    content.querySelector('[name="category"]')?.addEventListener('change', event => {
      this.category = event.target.value;
      this.search = '';
      content.querySelector('[name="search"]').value = '';
      this.filterChecks(content);
    });
    content.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => this.onAction(button)));
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
  updateModifier(content = this.element, updateValue = true) {
    const field = content.querySelector('[name="modifier"]');
    if (!field) return;
    if (this.modifier) this.modifierDirection = this.modifier < 0 ? -1 : 1;
    if (updateValue) field.value = Number.isSafeInteger(this.modifier) ? String(Math.abs(this.modifier)) : '';
    field.dataset.mode = this.modifier === 0 ? 'neutral' : this.modifierDirection < 0 ? 'relief' : 'difficulty';
    const label = this.modifierDirection < 0 ? 'Erleichterung' : 'Erschwernis';
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
    content.querySelectorAll('.pp-rank-legend').forEach(legend => { legend.hidden = !scales.has(legend.dataset.scale); });
  }
  async onAction(button) {
    if (this.busy) return;
    this.busy = true;
    button.disabled = true;
    try {
      if (button.dataset.action === 'import') await this.importCharacter();
      if (button.dataset.action === 'roll') {
        this.element.querySelectorAll('[name="modifier"], [name="modifierDirection"]').forEach(field => { field.disabled = true; });
        const check = getCharacter(this.actor)?.checks.find(check => check.id === button.dataset.check);
        await executeCheck(this.actor, check, this.token, { modifier: this.modifier, blind: button.dataset.blind === 'true' });
        this.modifier = 0;
        this.modifierDirection = 1;
        this.updateModifier();
      }
      if (button.dataset.action === 'token') await this.linkSelectedToken();
    } catch (error) {
      console.error(MODULE_ID, error);
      ui.notifications.error(error.message || 'Die Aktion konnte nicht ausgeführt werden.');
    } finally {
      this.busy = false; button.disabled = false;
      this.element.querySelectorAll('[name="modifier"], [name="modifierDirection"]').forEach(field => { field.disabled = false; });
    }
  }
  async importCharacter() {
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
    this.category = 'all';
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
