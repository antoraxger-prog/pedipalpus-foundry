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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.22 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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





 await page.evaluate(async raw=>{const{normalizeCharacter}=await import('/scripts/data.js'),character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};window.connectionActor=await foundry.documents.Actor.create({name:'Verbindungsprüfung',type:'character',flags:{'pedipalpus-foundry':{character}}});window.connectionBefore=JSON.stringify(connectionActor);window.connectionApp=await game.modules.get('pedipalpus-foundry').api.open(connectionActor.id);await connectionApp.persist({...connectionApp.preferences,sound:false,animations:'none'});await connectionApp.render();window.originalCommands={...foundry.applications.sidebar.tabs.ChatLog.CHAT_COMMANDS};},retinueFixture());
 const warning=page.locator('.pp-warning');const set=async(active,version)=>page.evaluate(async({active,version})=>{Object.assign(game.modules.get('ucurifunke-checks'),{active,version});await connectionApp.render();},{active,version});
 assert.equal(await warning.count(),0);assert.ok(await page.locator('.pp-dice-button:not([disabled])').count()>0);await set(false,'1.0.14');console.log(JSON.stringify({enabled:await page.locator('.pp-dice-button:not([disabled])').count(),warnings:await warning.count()}));assert.equal(await page.locator('.pp-dice-button:not([disabled])').count(),0);assert.equal(await warning.isVisible(),true);assert.match(await warning.innerText(),/aktivieren/);
 console.log('PASS: A working connection has no extra warning; an inactive dice module visibly explains the disabled dice.');
 await set(true,'1.0.7');assert.equal(await page.locator('.pp-dice-button:not([disabled])').count(),0);assert.match(await warning.innerText(),/mindestens Version 1.0.8/);await set(true,'1.0.14');await page.evaluate(async()=>{const registry=foundry.applications.sidebar.tabs.ChatLog.CHAT_COMMANDS;for(const key of Object.keys(registry))if(key.toLowerCase().endsWith('skillcheck'))delete registry[key];await connectionApp.render();});assert.equal(await page.locator('.pp-dice-button:not([disabled])').count(),0);assert.match(await warning.innerText(),/Würfelbefehle.*Welt neu laden/);await page.evaluate(()=>Object.assign(foundry.applications.sidebar.tabs.ChatLog.CHAT_COMMANDS,originalCommands));
 console.log('PASS: Too-old modules and missing command registration show their specific existing correction messages without enabling unsupported dice.');
 await set(true,'1.0.15');assert.equal(await page.locator('.pp-dice-button:not([disabled])').count(),0);assert.match(await warning.innerText(),/neue Ucurifunke-Version aktualisieren/);await set(true,'1.0.8');assert.equal(await warning.count(),0);await page.locator('[data-action="battle"]').click();await page.waitForFunction(()=>!connectionApp.busy&&!connectionApp.referenceBusy);assert.match(await warning.innerText(),/Kampfproben benötigen.*1.0.14/);assert.equal(await page.locator('.pp-weapon-action .pp-dice-button:not([disabled])').count(),0);await set(true,'1.0.14');assert.equal(await warning.count(),0);assert.ok(await page.locator('.pp-weapon-action .pp-dice-button:not([disabled])').count()>0);
 console.log('PASS: A hypothetical newer module stays guarded, old supported skill-only versions warn only in combat, and restoring the supported connection removes the warning and unlocks dice.');
 await set(false,'1.0.14');await page.setViewportSize({width:412,height:900});for(const theme of ['fantasy','ork','demonic','aristocrat','warrior','arcane','sneaky','dark','light']){await page.evaluate(async theme=>{await(await import('/scripts/design.js')).saveDesign(theme);await connectionApp.render();},theme);assert.equal(await warning.isVisible(),true);assert.match(await warning.innerText(),theme==='ork'?/Würfel-Helfer.*Meister holen/:/aktivieren/);assert.equal(await page.locator('.pp-root').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);}await page.evaluate(async()=>{connectionActor.isOwner=false;connectionActor.canUserModify=()=>false;await connectionApp.render();});assert.equal(await warning.isVisible(),true);assert.equal(await page.locator('.pp-dice-button:not([disabled])').count(),0);assert.equal(await page.evaluate(()=>JSON.stringify(connectionActor.flags)),await page.evaluate(()=>JSON.stringify(JSON.parse(connectionBefore).flags)));assert.equal(await page.evaluate(()=>testMessages.length),0);assert.deepEqual(errors,[]);await page.screenshot({path:path.resolve(root,'../artifacts/connection-warning-1.11.22.png')});
 console.log('PASS: The warning fits all nine themes including Ork and remains useful for observers without changing characters, rights or chat.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
