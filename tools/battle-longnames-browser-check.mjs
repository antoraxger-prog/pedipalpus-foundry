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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.24 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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





 const raw=retinueFixture();raw.MeleeWeapons[0].Name='ZweihänderderköniglichkaiserlichenPalastwache';raw.MeleeWeapons[0].Damage='2W6+12';raw.Animals[0].Name='SkelettträgerdesunsterblichenNekromanten';raw.Animals[0].Species='SchwerlasttransportundTragekonstruktion';
 await page.evaluate(async raw=>{const{normalizeCharacter}=await import('/scripts/data.js');const character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};window.longActor=await foundry.documents.Actor.create({name:'Kampfansicht',type:'character',flags:{'pedipalpus-foundry':{character}}});window.longBefore=JSON.stringify(longActor);window.longApp=await game.modules.get('pedipalpus-foundry').api.open(longActor.id);await longApp.persist({...longApp.preferences,sound:false,animations:'none',density:'comfortable',textScale:130});await longApp.setMode('battle');},raw);
 const idle=()=>page.waitForFunction(()=>!longApp.busy&&!longApp.referenceBusy);
 const fits=async()=>{const bad=await page.evaluate(()=>[...document.querySelectorAll('.pp-root,.pp-check-list,[data-companion-card],.pp-weapon-header th')].filter(el=>el.checkVisibility()).filter(el=>el.scrollWidth>el.clientWidth+2).map(el=>({tag:el.tagName,class:el.className,width:el.clientWidth,scroll:el.scrollWidth,text:el.textContent.slice(0,80)})));assert.deepEqual(bad,[]);};
 assert.equal(await page.evaluate(()=>longApp.preferences.textScale),130);assert.ok(Math.abs(await page.locator('.pp-check-name').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))-18.2)<0.1);
 for(const width of [412,500,900])for(const theme of ['fantasy','dark','light','ork','demonic','aristocrat','warrior','arcane','sneaky']){await page.setViewportSize({width,height:900});await page.evaluate(async theme=>{await(await import('/scripts/design.js')).saveDesign(theme);await longApp.render();},theme);await fits();}
 console.log('PASS: Long unbroken weapon, companion and species names wrap without horizontal clipping in all nine themes at three widths with actual 130 percent comfortable text.');
 await page.setViewportSize({width:412,height:900});await page.evaluate(async()=>{await(await import('/scripts/design.js')).saveDesign('fantasy');await longApp.render();});await page.locator('[data-action="expand-companions"]').click();await idle();await fits();assert.equal(await page.locator('[data-companion-section][open]').count(),3);await page.locator('[data-companion-section]').first().locator('[data-action="animal-portrait"]').click();await page.locator('[name="portraitFile"]').waitFor();await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();await page.locator('[data-companion-section]').first().locator('[data-action="companion-state"]').click();await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();await fits();
 console.log('PASS: Expanding long-name companions keeps every table within the list, and image/energy controls still open their own dialogs without changing data when cancelled.');
 await page.locator('[name="modifier"]').fill('2');const attack=page.locator('[data-check-id="combat:MeleeWeapons:0:attack"]');await attack.locator('.pp-dice-button[data-blind="false"]').click();await idle();assert.equal(await page.evaluate(()=>testMessages.length),1);assert.match(await page.evaluate(()=>testMessages[0].content),/ZweihänderderköniglichkaiserlichenPalastwache/);assert.equal(await page.locator('[name="modifier"]').inputValue(),'0');await attack.locator('.pp-dice-button[data-blind="true"]').click();await idle();assert.equal(await page.evaluate(()=>testMessages.length),2);assert.equal(await page.evaluate(()=>testMessages[1].testMode),'blind');await fits();
 console.log('PASS: Normal and blind dice on the long weapon still submit exactly one intended roll each; the one-shot modifier resets normally.');
 await page.evaluate(async()=>{longActor.isOwner=false;longActor.canUserModify=()=>false;await longApp.render();});await fits();assert.equal(await page.locator('.pp-dice-button:not([disabled])').count(),0);assert.equal(await page.locator('[data-action="animal-portrait"]:not([disabled])').count(),0);await page.evaluate(()=>longActor.isOwner=true);assert.equal(await page.evaluate(()=>JSON.stringify(longActor)),await page.evaluate(()=>longBefore));assert.deepEqual(errors,[]);await page.screenshot({path:path.resolve(root,'../artifacts/battle-longnames-1.11.24.png')});
 console.log('PASS: Observer controls remain disabled, long names remain readable, and the complete character, companion data, ownership and artwork stay unchanged with no browser errors.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
