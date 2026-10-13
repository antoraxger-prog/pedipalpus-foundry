export const CHECKS_MODULE = 'ucurifunke-checks';

export function buildCommand(check) {
  if (!check || check.reason) throw new Error(check?.reason || 'Die Probe wurde nicht gefunden.');
  const safeName = name => typeof name === 'string' && name.trim() && !/[|\r\n]/.test(name) && name.length <= 160;
  if (!safeName(check.name) || !Number.isSafeInteger(check.value)) throw new Error('Die Probe enthält ungültige Werte.');
  if (check.kind === 'attribute') return `/attributecheck ${check.name} ${check.value}`;
  if (check.kind !== 'skill' || check.attributes?.length !== 3
      || check.attributes.some(x => !safeName(x.name) || !Number.isSafeInteger(x.value))) {
    throw new Error('Die Probenattribute sind nicht vollständig definiert.');
  }
  return `/skillcheck ${check.name}` + check.attributes.map(att => ` | ${att.name} ${att.value}`).join('') + ` | ${check.value}`;
}

export function connectionStatus() {
  const module = game.modules.get(CHECKS_MODULE);
  if (!module?.active) return { ready: false, message: 'Bitte „Ucurifunke – Proben“ ab Version 1.0.8 aktivieren.' };
  if (foundry.utils.isNewerVersion('1.0.8', module.version)) return { ready: false, message: 'Bitte „Ucurifunke – Proben“ auf mindestens Version 1.0.8 aktualisieren.' };
  const registry = foundry.applications.sidebar.tabs.ChatLog.CHAT_COMMANDS;
  if (!hasCommand(registry, 'skillcheck') || !hasCommand(registry, 'attributecheck')) {
    return { ready: false, message: 'Die Ucurifunke-Würfelbefehle sind nicht verfügbar. Bitte die Welt neu laden.' };
  }
  const directReady = !foundry.utils.isNewerVersion(module.version, '1.0.14');
  return { ready: true, directReady, message: directReady ? `Ucurifunke – Proben ${module.version} verbunden`
    : 'Bitte Pedipalpus – Proben für diese neue Ucurifunke-Version aktualisieren.' };
}

function hasCommand(registry, name) {
  return [registry?.[`${CHECKS_MODULE}.${name}`], registry?.[name]]
    .some(command => typeof command?.fn === 'function');
}

export async function executeCheck(actor, check, token = null, options = null) {
  if (!actor?.isOwner) throw new Error('Du benötigst Besitzerrechte für diesen Charakter, um damit zu würfeln.');
  const status = connectionStatus();
  if (!status.ready) throw new Error(status.message);
  if (token && (!token.actorLink || token.actorId !== actor.id)) throw new Error('Der Token muss mit diesem Foundry-Charakter verknüpft sein.');
  const speaker = token
    ? foundry.documents.ChatMessage.getSpeaker({ actor, token, scene: token.parent })
    : { actor: actor.id, alias: actor.name };
  const command = buildCommand(check);
  if (options === null) return ui.chat.processMessage(command, { speaker });
  const modifier = options.modifier ?? 0;
  if (!Number.isSafeInteger(modifier)) throw new Error('Bitte eine ganze Zahl für die Erschwernis oder Erleichterung eingeben.');
  if (foundry.utils.isNewerVersion(game.modules.get(CHECKS_MODULE).version, '1.0.14')) {
    throw new Error('Diese Ucurifunke-Version benötigt eine aktualisierte Direktwurf-Anbindung. Bitte Pedipalpus – Proben aktualisieren.');
  }
  const registry = foundry.applications.sidebar.tabs.ChatLog.CHAT_COMMANDS;
  const name = check.kind === 'attribute' ? 'attributecheck' : 'skillcheck';
  const key = [name, `${CHECKS_MODULE}.${name}`].find(key => typeof registry[key]?.fn === 'function');
  const handler = registry[key];
  const match = command.match(handler.rgx);
  if (!match) throw new Error('Der Würfelbefehl wird von Ucurifunke – Proben nicht erkannt.');
  const DialogV2 = foundry.applications.api.DialogV2;
  const original = DialogV2.input;
  const title = `${check.kind === 'attribute' ? 'Attributsprobe' : 'Fertigkeitsprobe'}: ${check.name}`;
  let consumed = false;
  let pending;
  // Nur den synchron angeforderten Modifikator-Dialog dieses Befehls ersetzen.
  // Vor dem ersten asynchronen Würfelschritt ist die Originalfunktion wieder aktiv.
  DialogV2.input = function(config) {
    const content = config?.content ?? '';
    if (!consumed && config?.window?.title === title) {
      if (!content.includes('name="difficulty"') || !content.includes('name="relief"')
          || !(content.includes('name="hidden"') || content.includes('name="blind"'))) {
        return Promise.reject(new Error('Der Modifikator-Dialog wurde geändert. Bitte Pedipalpus – Proben aktualisieren.'));
      }
      consumed = true;
      return Promise.resolve({ difficulty: Math.max(0, modifier), relief: Math.max(0, -modifier),
        hidden: options.blind === true, blind: options.blind === true });
    }
    return original.call(this, config);
  };
  try { pending = handler.fn.call(handler, key, match, { speaker }); }
  finally { DialogV2.input = original; }
  await pending;
  if (!consumed) throw new Error('Der Direktwurf konnte nicht übernommen werden. Bitte Ucurifunke – Proben aktualisieren; die Eingabe bleibt erhalten.');
}
