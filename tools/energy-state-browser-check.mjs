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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.10 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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


 await page.addStyleTag({content:'.mock-dialog{box-sizing:border-box;width:min(520px,calc(100vw - 24px));max-height:calc(100vh - 24px);top:12px;padding:16px;font-size:18.2px}.mock-dialog *{box-sizing:border-box}.mock-dialog input,.mock-dialog button,.mock-dialog select{font:inherit}'});
 const raw=retinueFixture();const modern=value=>{if(!value||typeof value!=='object')return;if(value.ShortName&&Number.isSafeInteger(value.TotalValue)){value.BaseValue=value.TotalValue;value.ModValue=0;delete value.TotalValue;}for(const child of Object.values(value))modern(child);};modern(raw);raw.DerivedValues=[{ShortName:'LE',TotalValue:31,BaseValue:1,ModValue:2}];
 await page.evaluate(async raw=>{const {normalizeCharacter}=await import('/scripts/data.js'),character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)},actor=await foundry.documents.Actor.create({name:raw.Name,type:'character',flags:{'pedipalpus-foundry':{character}}});window.energyActor=actor;window.energyApp=await game.modules.get('pedipalpus-foundry').api.open(actor.id);},raw);

 const idle=()=>page.waitForFunction(()=>!energyApp.busy&&!energyApp.referenceBusy);const before=()=>page.evaluate(()=>JSON.stringify(energyActor.flags));const source=await page.evaluate(()=>energyActor.getFlag('pedipalpus-foundry','character').sourceJSON);
 const open=async()=>{if(!await page.locator('[data-action="playstate"]').isVisible())await page.locator('[data-action="administration"]').click();await page.locator('[data-action="playstate"]').click();};
 const fits=async()=>{const result=await page.locator('.mock-dialog').evaluate(dialog=>{const form=dialog.querySelector('form'),bounds=form.getBoundingClientRect();return {viewport:innerWidth,client:form.clientWidth,scroll:form.scrollWidth,fields:[...form.querySelectorAll('input,select,[data-energy-step]')].filter(el=>el.checkVisibility()).flatMap(el=>{const rect=el.getBoundingClientRect();return rect.right>bounds.right+1||rect.left<bounds.left-1?[el.dataset.complex??el.dataset.energy??el.textContent.trim()]:[]})};});assert.ok(result.scroll<=result.client+1,JSON.stringify(result));assert.deepEqual(result.fields,[]);return result;};
 const baseline=await before();await open();const widths=[];for(const width of [640,360,320]){await page.setViewportSize({width,height:900});widths.push(await fits());}await page.screenshot({path:path.resolve(root,'../artifacts/energy-state-1.11.13.png')});await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();assert.equal(await before(),baseline);
 console.log('PASS: All state and energy controls fit 640/360/320px viewports with enlarged dialog text; cancelling the layout check preserves the character.');
 await page.setViewportSize({width:640,height:900});await open();assert.equal(await page.locator('[data-resource-row="0"][data-energy="LE"]').inputValue(),'31');await page.locator('[data-energy-row="0"][data-energy-name="LE"][data-energy-step="-1"]').click();await page.locator('[data-energy-row="1"][data-energy-name="LE"][data-energy-step="-1"]').click();assert.equal(await before(),baseline);await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();assert.equal(await before(),baseline);
 console.log('PASS: Main and animal plus/minus controls edit only the draft; cancelling both changes performs no character write.');
 const childId=await page.evaluate(async()=>{const {companionSnapshot,companionKey}=await import('/scripts/companions.js'),character=energyActor.getFlag('pedipalpus-foundry','character'),child=await foundry.documents.Actor.create({name:'Testbegleiter',type:'character',flags:{'pedipalpus-foundry':{character:companionSnapshot(character,0),companion:{sourceActorId:energyActor.id,key:companionKey(character,0)}}}});window.energyChild=child;return child.id;});
 await open();await page.locator('[data-energy-row="0"][data-energy-name="LE"][data-energy-step="-1"]').click();await page.locator('[data-energy-row="1"][data-energy-name="LE"][data-energy-step="-1"]').click();await page.locator('.mock-dialog [data-action="save"]').click();await idle();const values=()=>page.evaluate(()=>{const character=energyActor.getFlag('pedipalpus-foundry','character');return {root:character.resources.find(row=>row.name==='LE').value,members:character.retinue.map(row=>row.CurrentLe),child:energyChild.getFlag('pedipalpus-foundry','character').resources.find(row=>row.name==='LE').value,source:character.sourceJSON};});assert.deepEqual(await values(),{root:30,members:[13,14,14],child:13,source});
 console.log('PASS: Saving a main/animal energy draft updates exactly those energies, refreshes the linked child and preserves other companions plus source JSON.');
 const saved=await before();await open();await page.locator('[data-resource-row="0"][data-energy="LE"]').fill('');await page.locator('[data-resource-row="1"][data-energy="LE"]').fill('10');await page.locator('.mock-dialog [data-action="save"]').click();await idle();assert.equal(await before(),saved);assert.match(await page.locator('#notice').textContent(),/ganze Energiewerte/);
 console.log('PASS: An invalid empty energy blocks the entire save before writes, including the other valid edited companion value.');
 await page.locator('[name="actor"]').selectOption(childId);await idle();await page.locator('[data-action="companion-state"]').click();assert.equal(await page.locator('[data-resource-row]').count(),1);await page.locator('[data-energy="LE"]').fill('12');await page.locator('.mock-dialog [data-action="save"]').click();await idle();assert.deepEqual(await values(),{root:30,members:[12,14,14],child:12,source});
 console.log('PASS: Editing a linked companion through its own window changes only its parent entry and linked snapshot; main and other creature energies stay intact.');
 await page.locator('[name="actor"]').selectOption(await page.evaluate(()=>energyActor.id));await idle();for(const theme of ['fantasy','dark','light','ork','demonic','aristocrat','warrior','arcane','sneaky']){await page.evaluate(async theme=>{await (await import('/scripts/design.js')).saveDesign(theme);await energyApp.render();},theme);await page.setViewportSize({width:320,height:900});await open();await fits();await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();}await open();await page.locator('[data-complex="4"]').fill('2');await page.locator('[data-suppression="4"]').selectOption('2');await page.locator('.mock-dialog [data-action="save"]').click();await idle();assert.deepEqual(await page.evaluate(()=>{const row=energyActor.getFlag('pedipalpus-foundry','character').localState.conditions.complex.find(row=>row.Name==='Überanstrengung');return [row.Level,row.Suppression];}),[2,2]);assert.deepEqual(await values(),{root:30,members:[12,14,14],child:12,source});assert.equal(await page.evaluate(()=>testMessages.length),0);assert.deepEqual(errors,[]);
 console.log('PASS: Every design keeps narrow state fields reachable; saving a wrapped condition and suppression preserves all energies and source JSON, with no rolls or browser errors.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
