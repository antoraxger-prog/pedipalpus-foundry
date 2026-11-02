import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { fixture, combatFixture, retinueFixture, npcFixture } from '../tests/fixture.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PEDIPALPUS_PLAYWRIGHT || 'playwright');
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const checksVersion = process.env.PEDIPALPUS_CHECKS_VERSION || '1.0.14';
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.6.0 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
const uploadedImages = new Map();
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if(url.pathname==='/preview-upload' && request.method==='POST'){
      const target=url.searchParams.get('path');if(!/^worlds\/test-world\/pedipalpus-portraits\/[a-f0-9]{64}\.(?:png|jpg|jpeg|bmp|webp)$/.test(target??''))throw new Error('Invalid upload');
      const chunks=[];for await(const chunk of request)chunks.push(chunk);uploadedImages.set('/'+target,Buffer.concat(chunks));return response.end('Uploaded');
    }
    if(url.pathname==='/icons/svg/mystery-man.svg'){response.setHeader('Content-Type','image/svg+xml');return response.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#6e634c"/><circle cx="32" cy="23" r="12" fill="#d6c5a1"/><path d="M10 64V54c0-24 44-24 44 0v10" fill="#d6c5a1"/></svg>');}
    if(uploadedImages.has(url.pathname)){response.setHeader('Content-Type',/\.jpe?g$/.test(url.pathname)?'image/jpeg':/\.webp$/.test(url.pathname)?'image/webp':'image/png');return response.end(uploadedImages.get(url.pathname));}
    if (url.pathname === '/') { response.setHeader('Content-Type', 'text/html; charset=utf-8'); return response.end(pageHTML); }
    let target;
    if (url.pathname === '/checks-reference.js') target = fileURLToPath(new URL(`../../pedipalpus-checks/ucurifunke-v${checksVersion}/${checksVersion === '1.0.8' ? 'ucurifunke-checks/' : ''}scripts/ucurifunke-checks.js`, import.meta.url));
    else { target = path.resolve(root, '.' + url.pathname); if (!target.startsWith(root + path.sep)) throw new Error('Invalid path'); }
    response.setHeader('Content-Type', target.endsWith('.wav') ? 'audio/wav' : target.endsWith('.svg') ? 'image/svg+xml' : target.endsWith('.css') ? 'text/css' : 'text/javascript');
    response.end(await fs.readFile(target));
  } catch { response.statusCode = 404; response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.PEDIPALPUS_BROWSER});const page=await browser.newPage({viewport:{width:1120,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000);
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>window.previewReady);
 await page.evaluate(({raw,npc})=>{
  window.rawSource=raw;window.npcSource=npc;game.user.isGM=true;
  const file=(name,value)=>({kind:'file',name,getFile:async()=>new File([JSON.stringify(value())],name,{type:'application/json'})});
  const folder=(name,files,folders={})=>({kind:'directory',name,queryPermission:async()=> 'granted',async *values(){yield*files;},async getFileHandle(){throw Object.assign(new Error('Not found'),{name:'NotFoundError'});},async getDirectoryHandle(key){if(folders[key])return folders[key];throw Object.assign(new Error('Not found'),{name:'NotFoundError'});}});
  const prepared={Format:'Pedipalpus.Gefolge',Version:1,Name:'Einzelwache',Undead:[raw.Undead[0]]};
  window.savedFolder=folder('Pedipalpus',[file('paket.json',()=>prepared)],{SavedCharacters:folder('SavedCharacters',[file('held.json',()=>rawSource)]),SavedNpcs:folder('SavedNpcs',[file('held.nsc.json',()=>npcSource)])});
  window.showDirectoryPicker=async options=>{window.pickerMode=options.mode;return savedFolder;};window.showOpenFilePicker=undefined;
 },{raw:retinueFixture(),npc:npcFixture()});
 const idle=()=>page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy&&!app.referenceBusy));
 const appState=()=>page.evaluate(()=>JSON.stringify(game.actors.contents));
 const open=async(kind='retinue')=>{if(!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();await page.locator('[data-action="import"]').click();await page.locator(`[data-import-kind="${kind}"]`).click();};
 const ready=async()=>{try{await page.waitForFunction(()=>document.querySelector('.mock-dialog [data-action="import"]')?.disabled===false);}catch(error){console.log(await page.locator('.mock-dialog').innerText(),errors);throw error;}};
 const submit=async()=>{await page.locator('.mock-dialog [data-action="import"]').click();await page.waitForFunction(()=>!document.querySelector('.mock-dialog')||document.querySelector('.pp-import-diff'));if(await page.locator('.pp-import-diff').count())await page.locator('.mock-dialog [data-action="accept"]').click();await idle();};
 const select=async text=>{const value=await page.locator('[name="folderRetinue"] option').evaluateAll((rows,text)=>rows.find(row=>row.textContent.includes(text))?.value,text);assert.ok(value!==undefined);await page.locator('[name="folderRetinue"]').selectOption(value);await ready();};
 await open('character');await page.locator('[data-pick-folder]').click();await ready();await page.locator('[name="includeImages"]').uncheck();await page.locator('[data-companion-import-index="0"]').selectOption('new');await submit();
 const parent=await page.locator('[name="actor"]').inputValue(),protectedActors=await appState();
 await open();await page.locator('[name="folderRetinue"] option').nth(1).waitFor({state:'attached'});assert.equal(await page.locator('[name="folderRetinue"] option').count(),4);await select('SavedCharacters/held');
 assert.equal(await page.locator(`[name="destination"] option[value="${parent}"]`).evaluate(el=>el.disabled),true);assert.equal(await page.locator('[name="includeCompanions"]').isDisabled(),true);assert.equal(await page.locator('[data-companion-import-index]').count(),3);
 await page.locator('[name="includeImages"]').uncheck();await page.locator('[name="destination"]').selectOption('');await submit();
 const library=await page.locator('[name="actor"]').inputValue();assert.notEqual(library,parent);
 assert.equal(await page.evaluate(before=>JSON.stringify(game.actors.contents.slice(0,JSON.parse(before).length))===before,protectedActors),true);
 assert.equal(await page.evaluate(id=>{const c=game.actors.get(id).getFlag('pedipalpus-foundry','character');return c.profile.retinueOnly&&c.retinue.length===3&&c.checks.every(x=>x.companionGroup);},library),true);
 console.log('PASS: A remembered Pedipalpus folder is available in retinue mode; extraction imports only three companions and preserves the main character and its existing skeleton actor.');
 await open();await page.locator('[data-pick-retinue-folder]').click();assert.equal(await page.evaluate(()=>pickerMode),'read');await select('SavedNpcs/held.nsc');await page.locator('[name="includeImages"]').uncheck();await page.locator('[name="destination"]').selectOption('');await submit();
 assert.equal(await page.evaluate(()=>{const app=Array.from(foundry.applications.api.ApplicationV2.instances())[0],c=game.actors.get(app.actorId).getFlag('pedipalpus-foundry','character');return c.retinue.length===7&&c.checks.filter(x=>x.companionAbility).every(x=>x.npcRules);}),true);
 console.log('PASS: The explicit folder button requests read-only access and imports all seven NPC companion kinds without NPC main probes.');
 await page.evaluate(async id=>{const app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];app.actorId=id;rawSource.Animals[0].CurrentLe=9;window.refreshTask=app.refreshCharacter();},library);
 await page.locator('.pp-import-diff').waitFor();await page.locator('.mock-dialog [data-action="accept"]').click();await page.evaluate(()=>window.refreshTask);await idle();
 assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').retinue[0].CurrentLe,library),9);assert.equal(await page.evaluate(before=>JSON.stringify(game.actors.contents.slice(0,JSON.parse(before).length))===before,protectedActors),true);
 console.log('PASS: Refresh from the remembered source remains retinue-only and leaves the unrelated main character and skeleton unchanged.');
 await open();await select('paket');await page.locator('[name="destination"]').selectOption('');await page.locator('[name="includeImages"]').uncheck();await submit();assert.equal(await page.locator('.pp-companion-section').count(),1);
 console.log('PASS: Prepared single-creature files in the folder still import and open directly in combat.');
 await page.evaluate(()=>{window.showDirectoryPicker=undefined;const app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];app.importFolders={};});await open();
 await page.locator('[name="retinueFolder"]').evaluate((input,raw)=>{const dt=new DataTransfer();for(const name of ['SavedCharacters/held.json','SavedNpcs/held.nsc.json']){const file=new File([JSON.stringify(name.includes('SavedNpcs')?raw.npc:raw.character)],name.split('/').at(-1),{type:'application/json'});Object.defineProperty(file,'webkitRelativePath',{value:'Pedipalpus/'+name});dt.items.add(file);}input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));},{character:retinueFixture(),npc:npcFixture()});
 await select('SavedCharacters/held');await page.screenshot({path:path.resolve(root,'../artifacts/retinue-folder-1.11.27.png')});
 await page.locator('[name="retinueFile"]').setInputFiles({name:'leer.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...combatFixture(),Animals:[],Demons:[],Undead:[],Chimeras:[],Persons:[],Elementals:[],Golems:[]}))});await page.waitForFunction(()=>document.querySelector('.pp-import-preview')?.textContent.includes('kein Gefolge'));assert.equal(await page.locator('.mock-dialog [data-action="import"]').isDisabled(),true);await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();
 console.log('PASS: Fallback folder selection works without native file handles; an empty source disables import with a clear message.');
 await page.evaluate(()=>{window.showDirectoryPicker=async()=>{throw Object.assign(new Error('Access denied'),{name:'NotAllowedError'});};});await open();const untouched=await appState();await page.locator('[data-pick-retinue-folder]').click();await page.waitForFunction(()=>document.querySelector('.pp-import-preview')?.textContent.includes('Access denied'));assert.equal(await page.locator('.mock-dialog [data-action="import"]').isDisabled(),true);assert.equal(await appState(),untouched);await page.locator('.mock-dialog [data-action="cancel"]').click();
 assert.deepEqual(errors,[]);console.log('PASS: Denied directory access cannot submit stale content or change existing actors; no browser errors.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
