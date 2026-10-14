import { MODULE_ID, FLAG, validSnapshot } from './data.js';
import { uploadPortrait, applyPortrait } from './portraits.js';
import { withArmorState } from './equipment.js';
import { withFocus } from './combat.js';

export const getCharacter = actor => {
  const value = actor?.getFlag(MODULE_ID, FLAG);
  return validSnapshot(value) ? value : null;
};

export async function saveFocus(actor, focus) {
  if (!actor?.isOwner || !actor.canUserModify(game.user, 'update')) throw new Error('Zum Ändern des Fokus werden Besitzerrechte benötigt.');
  const character = getCharacter(actor);
  if (!character) throw new Error('Bitte zuerst eine Charakterdatei importieren.');
  await actor.setFlag(MODULE_ID, FLAG, withFocus(character, focus));
}

export function visibleActors() {
  return game.actors.contents.filter(actor => actor.testUserPermission(game.user, 'OBSERVER'))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

export async function saveCharacter(snapshot, actorId = null, portrait = null, warn) {
  if (!validSnapshot(snapshot)) throw new Error('Die importierten Charakterdaten sind unvollständig.');
  if (game.system.id !== 'worldbuilding') throw new Error('Diese erste Version unterstützt Simple Worldbuilding.');
  if (actorId) {
    const actor = game.actors.get(actorId);
    if (!actor?.canUserModify(game.user, 'update')) throw new Error('Für den Import benötigst du Besitzerrechte auf den gewählten Charakter.');
    const image = portrait ? await uploadPortrait(portrait) : null;
    const tokenImage=portrait?.token?await uploadPortrait(portrait.token):image;
    // Das Flag besitzt ein festes Schema; Arrays werden vollständig ersetzt.
    // Andere Flags, Foundry-Werte, Besitzerrechte und die Actor-ID bleiben erhalten.
    await actor.setFlag(MODULE_ID, FLAG, snapshot);
    if (image) await applyPortrait(actor,image,warn,tokenImage);
    return actor;
  }
  if (!foundry.documents.Actor.canUserCreate(game.user)) throw new Error('Du darfst keine Charaktere anlegen. Dein Meister kann einen anlegen und dir Besitzerrechte geben.');
  const image = portrait ? await uploadPortrait(portrait) : null;
    const tokenImage=portrait?.token?await uploadPortrait(portrait.token):image;
  return foundry.documents.Actor.create({
    name: snapshot.profile.name, type: 'character', img: image || 'icons/svg/mystery-man.svg',
    ownership: { [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
    prototypeToken: { name: snapshot.profile.name, actorLink: true, ...(image ? {texture:{src:tokenImage}} : {}) },
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

export async function saveArmorState(actor,id,field,value) {
 if(!actor?.isOwner||!actor.canUserModify(game.user,'update'))throw new Error('Zum Ändern der Rüstung werden Besitzerrechte benötigt.');
 const character=getCharacter(actor);if(!character)throw new Error('Bitte zuerst eine Charakterdatei importieren.');
 await actor.setFlag(MODULE_ID,FLAG,withArmorState(character,id,field,value));
}
