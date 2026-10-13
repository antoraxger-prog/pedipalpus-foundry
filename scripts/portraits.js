export const MAX_PORTRAIT_SIZE = 10 * 1024 * 1024;

export async function preparePortrait(file) {
  if (!file || file.size <= 0 || file.size > MAX_PORTRAIT_SIZE) throw new Error('Bitte ein Bild bis 10 MB auswählen.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const bmp = bytes[0] === 66 && bytes[1] === 77;
  const webp = String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP';
  if (!png && !jpeg && !bmp && !webp) throw new Error('Bitte ein PNG-, JPG-, BMP- oder WebP-Bild auswählen.');
  let bitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error('Das Bild konnte nicht gelesen werden. Bitte eine gültige Bilddatei auswählen.'); }
  try {
    if (!bmp) return {file,extension:png ? 'png' : jpeg ? 'jpg' : 'webp'};
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap,0,0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/png'));
    if (!blob || blob.size > MAX_PORTRAIT_SIZE) throw new Error('Das umgewandelte Bild ist größer als 10 MB. Bitte ein kleineres PNG verwenden.');
    return {file:new File([blob],'portrait.png',{type:'image/png'}),extension:'png'};
  } finally { bitmap.close(); }
}

export async function uploadPortrait(prepared) {
  if (!game.user.isGM && !game.user.can?.('FILES_UPLOAD')) throw new Error('Zum Bildimport fehlen Upload-Rechte. Dein Meister kann das Bild importieren oder Uploads erlauben.');
  const worldId = game.world?.id;
  if (!/^[a-zA-Z0-9_-]+$/.test(worldId || '')) throw new Error('Die Foundry-Welt konnte für den Bildimport nicht bestimmt werden.');
  const picker = foundry.applications.apps.FilePicker.implementation;
  const folder = `worlds/${worldId}/pedipalpus-portraits`;
  const digest = await crypto.subtle.digest('SHA-256',await prepared.file.arrayBuffer());
  const hash = [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2,'0')).join('');
  const name = `${hash}.${prepared.extension}`;
  const parent = await picker.browse('data',`worlds/${worldId}`);
  if (!parent.dirs?.includes(folder)) {
    try { await picker.createDirectory('data',folder); }
    catch (error) { try { await picker.browse('data',folder); } catch { throw error; } }
  }
  const existing = await picker.browse('data',folder);
  const path = `${folder}/${name}`;
  if (existing.files?.includes(path)) return path;
  const result = await picker.upload('data',folder,new File([prepared.file],name,{type:prepared.file.type}),{}, {notify:false});
  if (!result?.path || result.error) throw new Error('Das Bild konnte nicht auf den Foundry-Server hochgeladen werden.');
  return result.path;
}

export async function applyPortrait(actor, path) {
  if (!actor?.canUserModify(game.user,'update')) throw new Error('Zum Bildimport benötigst du Besitzerrechte auf diesem Charakter.');
  await actor.update({img:path,'prototypeToken.texture.src':path});
  let skipped = 0;
  for (const scene of game.scenes?.contents ?? []) for (const token of scene.tokens?.contents ?? []) {
    if (token.actorId !== actor.id || !token.actorLink) continue;
    if (!token.canUserModify(game.user,'update')) { skipped++; continue; }
    try { await token.update({'texture.src':path}); } catch { skipped++; }
  }
  if (skipped) ui.notifications.warn(`Bild übernommen. ${skipped} verknüpfte Tokens konnten mangels Bearbeitungsrecht oder wegen eines Fehlers nicht aktualisiert werden.`);
}
