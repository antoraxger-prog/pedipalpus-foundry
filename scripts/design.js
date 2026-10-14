import { MODULE_ID } from './data.js';
export const THEMES = ['fantasy', 'dark', 'light', 'ork', 'demonic', 'aristocrat', 'warrior', 'arcane', 'sneaky'];
const valid = value => THEMES.includes(value);
export function registerDesignSettings() {
  game.settings.register(MODULE_ID, 'theme', {scope:'client', config:false, type:String, default:'fantasy'});
  game.settings.register(MODULE_ID, 'design', {scope:'user', config:false, type:String, default:''});
  game.settings.register(MODULE_ID, 'themeMigratedBy', {scope:'client', config:false, type:String, default:''});
}
export function savedDesign() {
  const personal = game.settings.get(MODULE_ID, 'design');
  if (valid(personal)) return personal;
  const owner = game.settings.get(MODULE_ID, 'themeMigratedBy');
  const legacy = game.settings.get(MODULE_ID, 'theme');
  return (!owner || owner === game.user.id) && valid(legacy) ? legacy : 'fantasy';
}
export async function initializeDesign() {
  if (valid(game.settings.get(MODULE_ID, 'design'))) return;
  const theme = savedDesign();
  if (!game.settings.get(MODULE_ID, 'themeMigratedBy')) await game.settings.set(MODULE_ID, 'themeMigratedBy', game.user.id);
  await saveDesign(theme);
}
export async function saveDesign(theme) {
  if (!valid(theme)) throw new Error('Diese Darstellung ist nicht verfügbar.');
  await game.settings.set(MODULE_ID, 'design', theme);
}
