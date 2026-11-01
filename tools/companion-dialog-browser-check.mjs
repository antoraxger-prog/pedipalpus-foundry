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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.9.3 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
const uploadedImages = new Map();
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if(url.pathname==='/preview-upload' && request.method==='POST'){
      const target=url.searchParams.get('path');if(!/^worlds\/test-world\/pedipalpus-portraits\/[a-f0-9]{64}\.png$/.test(target??''))throw new Error('Invalid upload');
      const chunks=[];for await(const chunk of request)chunks.push(chunk);uploadedImages.set('/'+target,Buffer.concat(chunks));return response.end('Uploaded');
    }
    if(url.pathname==='/icons/svg/mystery-man.svg'){response.setHeader('Content-Type','image/svg+xml');return response.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#6e634c"/><circle cx="32" cy="23" r="12" fill="#d6c5a1"/><path d="M10 64V54c0-24 44-24 44 0v10" fill="#d6c5a1"/></svg>');}
    if(uploadedImages.has(url.pathname)){response.setHeader('Content-Type','image/png');return response.end(uploadedImages.get(url.pathname));}
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
 browser=await chromium.launch({headless:true,executablePath:process.env.PEDIPALPUS_BROWSER});const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(10000);
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>window.previewReady);
 const raw=retinueFixture();raw.Demons[0].Name='  Testdämon  ';raw.Demons[0].MagicalAbilities[0].Name=' Illusion  ';
 const parentId=await page.evaluate(async raw=>{const {normalizeCharacter}=await import('/scripts/data.js');const actor=await foundry.documents.Actor.create({name:raw.Name,type:'character',flags:{'pedipalpus-foundry':{character:{...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)}}}});await game.modules.get('pedipalpus-foundry').api.open(actor.id);return actor.id;},raw);
 const idle=()=>page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy&&!app.referenceBusy));
 const admin=async()=>{if(!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();};
 await page.locator('[data-action="battle"]').click();await idle();await page.locator('[name="category"]').selectOption('demons');await page.locator('.pp-companion-section:not([hidden]) > summary > strong').click();
 await page.locator('.pp-dice-button[data-check="demons:0:magical:0"][data-blind="true"]').click();await page.locator('.mock-dialog [data-action="companion-check"]').click();await idle();assert.equal(await page.locator('.mock-dialog').count(),0);assert.equal(await page.evaluate(()=>testMessages.length),1);assert.equal(await page.evaluate(()=>testMessages[0].testMode),'blind');
 assert.equal(await page.evaluate(id=>JSON.parse(game.actors.get(id).getFlag('pedipalpus-foundry','character').sourceJSON).Demons[0].Name,parentId),'  Testdämon  ');
 console.log('PASS: A companion name with outer whitespace still rolls blind directly after the real attribute-selection dialog; its stored name is preserved.');
 for(const [theme,language,label] of [['ork','standard','Bilder übernehmen'],['fantasy','ork','Gesichter mitnehmen']]){
  await page.evaluate(async({theme,language})=>{const app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];await (await import('/scripts/design.js')).saveDesign(theme);await app.persist({...app.preferences,language});await app.render();},{theme,language});
  await admin();await page.locator('[data-action="import"]').click();assert.equal((await page.locator('label:has([name="includeImages"])').textContent()).trim(),label);await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();
 }
 console.log('PASS: Import dialogs honor explicit standard language in Ork design and Ork language in Fantasy design.');
 const childId=await page.evaluate(async parentId=>{const {companionSnapshot,companionKey}=await import('/scripts/companions.js'),parent=game.actors.get(parentId),character=parent.getFlag('pedipalpus-foundry','character'),snapshot=companionSnapshot(character,0);const actor=await foundry.documents.Actor.create({name:'Testbegleiter',type:'character',flags:{'pedipalpus-foundry':{character:snapshot,companion:{sourceActorId:parentId,key:companionKey(character,0)}}}});const app=Array.from(foundry.applications.api.ApplicationV2.instances())[0];await app.persist({...app.preferences,language:'standard'});await game.modules.get('pedipalpus-foundry').api.open(actor.id);return actor.id;},parentId);
 await page.locator('[data-action="companion-state"]').click();await page.locator('[data-energy="LE"]').fill('2');
 await page.evaluate(id=>{game.actors.get(id).flags['pedipalpus-foundry'].companion.active=false;},childId);await page.locator('.mock-dialog [data-action="save"]').click();await idle();assert.match(await page.locator('#notice').textContent(),/Begleiterzuordnung.*inzwischen geändert/);assert.equal(await page.evaluate(id=>game.actors.get(id).getFlag('pedipalpus-foundry','character').retinue[0].CurrentLe,parentId),14);
 console.log('PASS: Replacing a linked companion while its energy dialog is open stops the save and preserves the parent creature energies.');
 await page.locator('[data-action="companion-state"]').click();await idle();assert.match(await page.locator('#notice').textContent(),/Begleiter wurde ersetzt/);assert.equal(await page.locator('.mock-dialog').count(),0);
 await page.evaluate(async({parentId,childId})=>{const {normalizeCharacter}=await import('/scripts/data.js'),parent=game.actors.get(parentId),raw=JSON.parse(parent.getFlag('pedipalpus-foundry','character').sourceJSON);raw.Animals=[];parent.flags['pedipalpus-foundry'].character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};game.actors.get(childId).flags['pedipalpus-foundry'].companion.active=true;},{parentId,childId});
 await page.locator('[data-action="companion-state"]').click();await idle();assert.equal(await page.locator('.mock-dialog').count(),0);assert.match(await page.locator('#notice').textContent(),/nicht mehr eindeutig/);assert.deepEqual(errors,[]);
 console.log('PASS: Replaced or absent companions give an actionable message before opening an unusable editor; no fallback edits another creature.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
