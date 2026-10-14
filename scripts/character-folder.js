import { parseCharacter } from './data.js';
import { readCharacterFile } from './bundle.js';

const path=file=>String(file.webkitRelativePath||file.name||'').replace(/\\/g,'/').normalize('NFC');
export function characterFiles(files) {
  const all=Array.from(files??[]);
  if(all.length>10000)throw new Error('Bitte nur den Pedipalpus-Ordner oder den Charakterordner auswählen.');
  const json=all.filter(file=>/\.json$/i.test(file.name));
  const saved=json.filter(file=>/(?:^|\/)SavedCharacters\//i.test(path(file)));
  const selected=saved.length?saved:json.filter(file=>path(file).split('/').length<=2);
  return selected.sort((a,b)=>path(a).localeCompare(path(b),'de'));
}
export function matchingPortrait(files,filename) {
  if(!filename)return null;
  if(typeof filename!=='string'||/[\\/\u0000-\u001f]/.test(filename)||filename==='.'||filename==='..')throw new Error('Der gespeicherte Bilddateiname ist ungültig.');
  const key=filename.normalize('NFC').toLocaleLowerCase('de');
  let matches=Array.from(files??[]).filter(file=>file.name.normalize('NFC').toLocaleLowerCase('de')===key);
  const portraits=matches.filter(file=>/(?:^|\/)CharacterPortraits\//i.test(path(file)));
  if(portraits.length)matches=portraits;
  if(matches.length>1)throw new Error('Das Charakterbild ist im ausgewählten Ordner mehrfach vorhanden. Bitte das richtige Bild einzeln auswählen.');
  return matches[0]??null;
}
export async function readCharacterWithPortrait(file,files=[]) {
  const imported=await readCharacterFile(file),character=parseCharacter(imported.json);
  return {...imported,portrait:imported.portrait??matchingPortrait(files,character.profile.portraitFileName)};
}
