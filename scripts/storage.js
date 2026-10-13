import { MODULE_ID, FLAG, validSnapshot } from './data.js';

export const getCharacter = actor => {
  const value = actor?.getFlag(MODULE_ID, FLAG);
  return validSnapshot(value) ? value : null;
};

export function visibleActors() {
  return game.actors.contents.filter(actor => actor.testUserPermission(game.user, 'OBSERVER'))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

export async function saveCharacter(snapshot, actorId = null) {
  if (!validSnapshot(snapshot)) throw new Error('Die importierten Charakterdaten sind unvollständig.');
  if (game.system.id !== 'worldbuilding') throw new Error('Diese erste Version unterstützt Simple Worldbuilding.');
  if (actorId) {
    const actor = game.actors.get(actorId);
    if (!actor?.canUserModify(game.user, 'update')) throw new Error('Für den Import benötigst du Besitzerrechte auf den gewählten Charakter.');
    // Das Flag besitzt ein festes Schema; Arrays werden vollständig ersetzt.
    // Andere Flags, Foundry-Werte, Besitzerrechte und die Actor-ID bleiben erhalten.
    await actor.setFlag(MODULE_ID, FLAG, snapshot);
    return actor;
  }
  if (!foundry.documents.Actor.canUserCreate(game.user)) throw new Error('Du darfst keine Charaktere anlegen. Dein Meister kann einen anlegen und dir Besitzerrechte geben.');
  return foundry.documents.Actor.create({
    name: snapshot.profile.name, type: 'character', img: 'icons/svg/mystery-man.svg',
    ownership: { [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
    prototypeToken: { name: snapshot.profile.name, actorLink: true },
    flags: { [MODULE_ID]: { [FLAG]: snapshot } }
  });
}

export async function linkToken(actor, token, acceptUnlinked = false) {
  if (!actor || !getCharacter(actor)) throw new Error('Bitte zuerst einen Pedipalpus-Charakter auswählen.');
  if (!token?.canUserModify(game.user, 'update')) throw new Error('Du darfst diesen Token nicht bearbeiten. Die Verknüpfung kann dein Meister vornehmen.');
  if (!actor.isOwner) throw new Error('Du benötigst Besitzerrechte auf den Charakter.');
  if (!token.actorLink && token.actorId && !acceptUnlinked) throw new Error('Dieser Token besitzt ein eigenes Charakterblatt. Bitte die Übernahme des gemeinsamen Charakterblatts bestätigen.');
  if (token.actorId && token.actorId !== actor.id) throw new Error('Dieser Token gehört zu einem anderen Charakter. Ändere die Zuordnung zuerst in der Token-Konfiguration.');
  await token.update({ actorId: actor.id, actorLink: true });
}
