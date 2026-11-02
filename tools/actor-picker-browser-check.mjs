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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.12 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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



 const ids=await page.evaluate(async raw=>{const {normalizeCharacter}=await import('/scripts/data.js'),{companionSnapshot,companionKey}=await import('/scripts/companions.js'),base={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};const make=(name,character=base,extra={})=>foundry.documents.Actor.create({name,type:'character',flags:{'pedipalpus-foundry':{character,...extra}}});const first=await make('Haus <A> & B'),second=await make('Zweite Hauptfigur');const child=async parent=>make('Gleicher Träger',companionSnapshot(base,0),{companion:{sourceActorId:parent.id,key:companionKey(base,0)}});const a=await child(first),b=await child(second);for(let i=0;i<94;i++)await make(`Weitere Figur ${String(i).padStart(2,'0')}`);const hidden=await make('Verborgener Name');hidden.testUserPermission=()=>false;const npc=await make('Test-NSC',normalizeCharacter(window.selectorNpc));window.selectorMain=first;window.selectorChild=a;window.selectorBefore=JSON.stringify(game.actors.contents.map(actor=>actor.flags));const app=await game.modules.get('pedipalpus-foundry').api.open(first.id);window.selectorApp=app;return {first:first.id,second:second.id,a:a.id,b:b.id,hidden:hidden.id,npc:npc.id};},await (async()=>{await page.evaluate(raw=>window.selectorNpc=raw,npcFixture());return retinueFixture();})());
 const idle=()=>page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy&&!app.referenceBusy));const picker=page.locator('[name="actor"]');const label=id=>page.locator(`[name="actor"] option[value="${id}"]`).textContent();
 assert.match(await label(ids.a),/Gleicher Träger.*Gefolge: Haus <A> & B/);assert.match(await label(ids.b),/Gleicher Träger.*Gefolge: Zweite Hauptfigur/);assert.equal(await picker.locator('option').count(),100);assert.equal(await label(ids.npc),'Test-NSC [NSC]');assert.equal(await page.evaluate(()=>!!document.querySelector('[name="actor"] a')),false);
 console.log('PASS: A hundred visible choices distinguish equally named companions by their main figures; NPC markers remain and markup-like names stay plain text.');
 await page.locator('[name="search"]').fill('Geographie');await page.locator('[name="modifier"]').fill('3');await picker.selectOption(ids.a);await idle();assert.equal(await picker.inputValue(),ids.a);assert.equal(await page.locator('[name="search"]').inputValue(),'');assert.equal(await page.locator('[name="modifier"]').inputValue(),'0');assert.equal(await page.locator('.pp-root').getAttribute('data-mode'),'battle');assert.equal(await page.locator('[name="category"]').inputValue(),'all');assert.equal(await page.locator('[data-action="battle"]').count(),0);
 await picker.selectOption(ids.b);await idle();assert.equal(await picker.inputValue(),ids.b);await picker.selectOption(ids.first);await idle();assert.equal(await picker.inputValue(),ids.first);assert.equal(await page.evaluate(()=>testMessages.length),0);assert.equal(await page.evaluate(()=>JSON.stringify(game.actors.contents.map(actor=>actor.flags))),await page.evaluate(()=>selectorBefore));
 console.log('PASS: Switching main figure, linked animal, other linked animal and main figure resets transient search/modifier safely and leaves all character flags unchanged.');
 await page.evaluate(async()=>{selectorMain.name='Neue Hauptfigur';await selectorApp.render();});assert.match(await label(ids.a),/Gefolge: Neue Hauptfigur/);await page.evaluate(async()=>{selectorMain.testUserPermission=()=>false;await selectorApp.render();});assert.equal(await picker.locator(`option[value="${ids.first}"]`).count(),0);assert.equal(await label(ids.a),'Gleicher Träger [Gefolge]');assert.equal(await picker.locator(`option[value="${ids.hidden}"]`).count(),0);assert.doesNotMatch(await picker.innerText(),/Neue Hauptfigur|Haus <A>|Verborgener Name/);
 console.log('PASS: Renamed visible main figures refresh their labels; denied main figures and unrelated hidden actors never leak their names through a companion label.');
 await page.evaluate(async()=>{selectorMain.testUserPermission=()=>true;await selectorApp.persist({...selectorApp.preferences,language:'ork'});await selectorApp.render();});assert.equal(await label(ids.a),'Gleicher Träger [Bei: Neue Hauptfigur]');assert.equal(await label(ids.npc),'Test-NSC [NSC]');await picker.selectOption(ids.a);await idle();await page.setViewportSize({width:412,height:900});assert.equal(await page.locator('.pp-root').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);await picker.selectOption(ids.second);await idle();assert.equal(await picker.inputValue(),ids.second);
 console.log('PASS: Ork labels use simple wording while preserving real names; the many-entry selection remains usable in a narrow window.');
 await page.evaluate(async()=>{selectorChild.isOwner=false;selectorChild.canUserModify=()=>false;await selectorApp.render();});await picker.selectOption(ids.a);await idle();assert.equal(await page.locator('.pp-dice-button:not([disabled])').count(),0);assert.equal(await page.evaluate(()=>testMessages.length),0);assert.deepEqual(errors,[]);
 console.log('PASS: Companion labels grant no new rights; an observer can inspect a figure but cannot activate dice, with no browser errors or chat messages.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
