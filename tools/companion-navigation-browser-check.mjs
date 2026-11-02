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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.11 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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


 const raw=retinueFixture();await page.evaluate(async raw=>{const {normalizeCharacter}=await import('/scripts/data.js'),character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)},actor=await foundry.documents.Actor.create({name:raw.Name,type:'character',flags:{'pedipalpus-foundry':{character}}});window.navigationActor=actor;window.navigationBefore=JSON.stringify(actor.flags);await game.modules.get('pedipalpus-foundry').api.open(actor.id);},raw);
 const idle=()=>page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy));
 await page.locator('[data-action="battle"]').click();await idle();
 const query=page.locator('[name="search"]');
 const active=()=>page.evaluate(()=>({id:document.activeElement.dataset.check,quick:!!document.activeElement.closest('.pp-companion-quick'),visible:document.activeElement.checkVisibility()}));
 const expected=()=>page.evaluate(()=>[...document.querySelectorAll('.pp-check-row .pp-dice-button[data-blind="false"], .pp-companion-quick [data-action="roll"]')].filter(el=>!el.disabled&&el.checkVisibility()&&(!el.closest('.pp-companion-quick')||!el.closest('[data-companion-section]')?.open)).map(el=>({id:el.dataset.check,quick:!!el.closest('.pp-companion-quick'),visible:true})));
 const walk=async()=>{const list=await expected();assert.ok(list.length>2);await query.focus();for(const item of list){await page.keyboard.press('ArrowDown');assert.deepEqual(await active(),item);}await page.keyboard.press('ArrowDown');assert.deepEqual(await active(),list.at(-1));await page.keyboard.press('Home');assert.deepEqual(await active(),list[0]);await page.keyboard.press('End');assert.deepEqual(await active(),list.at(-1));for(const item of list.slice(0,-1).reverse()){await page.keyboard.press('ArrowUp');assert.deepEqual(await active(),item);}await page.keyboard.press('ArrowUp');assert.equal(await page.evaluate(()=>document.activeElement.name),'search');};
 await page.locator('[name="category"]').selectOption('animals');
 const quick=await expected();assert.equal(quick.length,2);await query.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');assert.deepEqual(await active(),quick.at(-1));await page.keyboard.press('End');assert.deepEqual(await active(),quick.at(-1));assert.equal(await page.locator('[data-companion-section][open]').count(),0);
 console.log('PASS: A collapsed animal never traps ArrowDown or End on its hidden attack, attributes or resistances.');
 await page.locator('[name="category"]').selectOption('all');await walk();assert.ok((await expected()).some(item=>item.quick));assert.equal(await page.evaluate(()=>testMessages.length),0);
 console.log('PASS: Closed animal, demon and undead quick rolls remain reachable in both directions, alongside ordinary combat rows, without rolling.');
 await page.locator('[data-action="expand-companions"]').click();await idle();assert.equal(await page.locator('[data-companion-section][open]').count(),3);await walk();assert.equal((await expected()).some(item=>item.quick),false);
 await page.locator('[data-action="collapse-companions"]').click();await idle();await walk();assert.equal(await page.locator('[data-companion-section][open]').count(),0);
 console.log('PASS: Expanding and collapsing previously laid-out companion tables switches navigation between actual rows and summary shortcuts.');
 await page.locator('[data-companion-section] > summary > strong').first().click();await walk();const mixed=await expected();assert.ok(mixed.some(item=>item.quick));assert.ok(mixed.some(item=>!item.quick&&item.id.startsWith('animals:')));
 await query.fill('Träger Mut');await query.press('ArrowDown');assert.equal((await active()).id,'animals:0:attribute:MU');assert.equal((await active()).visible,true);await page.keyboard.press('End');assert.equal((await active()).id,'animals:0:attribute:MU');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.name),'search');await query.fill('');await page.locator('[data-action="collapse-companions"]').click();await idle();
 console.log('PASS: Mixed open/closed companions and search-expanded matches expose only their visible normal dice; Escape returns to search.');
 await page.locator('[name="category"]').selectOption('animals');await query.press('ArrowDown');const rolled=(await active()).id;await page.keyboard.press('Enter');await idle();assert.equal(await page.evaluate(()=>testMessages.length),1);assert.match(await page.evaluate(()=>testMessages[0].content),/Skelett/);assert.equal(rolled,'animals:0:0:attack');assert.equal(await page.locator('[data-companion-section][open]').count(),0);assert.equal(await page.evaluate(()=>JSON.stringify(navigationActor.flags)),await page.evaluate(()=>navigationBefore));
 console.log('PASS: Enter on a reachable closed-companion shortcut submits exactly one normal roll, preserves collapse state and leaves stored character data untouched.');
 await page.evaluate(async()=>{navigationActor.isOwner=false;navigationActor.canUserModify=()=>false;await Array.from(foundry.applications.api.ApplicationV2.instances())[0].render();});await query.focus();await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.name),'search');assert.equal(await page.evaluate(()=>testMessages.length),1);assert.deepEqual(errors,[]);
 console.log('PASS: Observers cannot navigate to disabled dice or trigger extra rolls; all local browser checks finish without page errors.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
