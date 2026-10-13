export const CHECKS_MODULE = 'ucurifunke-checks';

export function buildCommand(check) {
  if (!check || check.reason) throw new Error(check?.reason || 'Die Probe wurde nicht gefunden.');
  const safeName = name => typeof name === 'string' && name.trim() && !/[|\r\n]/.test(name) && name.length <= 160;
  if (!safeName(check.name) || !Number.isSafeInteger(check.value)) throw new Error('Die Probe enthält ungültige Werte.');
  if (check.kind === 'attribute') return `/attributecheck ${check.name} | ${check.value}`;
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
  if (!registry?.[`${CHECKS_MODULE}.skillcheck`] || !registry?.[`${CHECKS_MODULE}.attributecheck`]) {
    return { ready: false, message: 'Die Ucurifunke-Würfelbefehle sind nicht verfügbar. Bitte die Welt neu laden.' };
  }
  return { ready: true, message: `Ucurifunke – Proben ${module.version} verbunden` };
}

export async function executeCheck(actor, check, token = null) {
  if (!actor?.isOwner) throw new Error('Du benötigst Besitzerrechte für diesen Charakter, um damit zu würfeln.');
  const status = connectionStatus();
  if (!status.ready) throw new Error(status.message);
  if (token && (!token.actorLink || token.actorId !== actor.id)) throw new Error('Der Token muss mit diesem Foundry-Charakter verknüpft sein.');
  const speaker = token
    ? foundry.documents.ChatMessage.getSpeaker({ actor, token, scene: token.parent })
    : { actor: actor.id, alias: actor.name };
  // Einziger Anschluss an die Würfelauswertung. Hier spätere Befehlsänderungen ergänzen.
  await ui.chat.processMessage(buildCommand(check), { speaker });
}
